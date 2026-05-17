import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Concept, type Question, type Option } from '../lib/db';
import { calculateNextState } from '../lib/fsrs';
import { ChevronLeft, Info, Timer, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Settings } from '../lib/settings';
import { hapticFeedback } from '../lib/haptics';

interface SessionProps {
  mode: 'practice' | 'revision' | 'exam';
  deckId?: string;
  onFinish: () => void;
  onBack: () => void;
  settings: Settings;
}

export default function Session({ mode, deckId, onFinish, onBack, settings }: SessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [examViolations, setExamViolations] = useState(0);

  // Use live query to get due concepts
  const dueConcepts = useLiveQuery(async () => {
    try {
      let results;
      if (mode === 'exam') {
        // Exam mode pulls all questions from deck
        const subjects = await db.subjects.where('deckId').equals(deckId || '').toArray();
        const subjectIds = subjects.map(s => s.id);
        const topics = await db.topics.where('subjectId').anyOf(subjectIds).toArray();
        const topicIds = topics.map(t => t.id);
        results = await db.concepts.where('topicId').anyOf(topicIds).toArray();
      } else {
        let query = db.concepts.where('nextReview').belowOrEqual(Date.now());
        results = await query.toArray();

        if (deckId) {
          const subjects = await db.subjects.where('deckId').equals(deckId).toArray();
          const subjectIds = subjects.map(s => s.id);
          const topics = await db.topics.where('subjectId').anyOf(subjectIds).toArray();
          const topicIds = topics.map(t => t.id);
          results = results.filter(c => topicIds.includes(c.topicId));
        }
      }
      
      return results;
    } catch (e) {
      console.error("dueConcepts Query Error:", e);
      return [];
    }
  }, [deckId, mode]);

  const currentConcept = dueConcepts?.[currentIndex];

  // Fullscreen management
  useEffect(() => {
    if (settings.isFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn("Fullscreen request denied or not supported");
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [settings.isFullscreen]);

  // Backgrounding detection (Anti-Cheat)
  useEffect(() => {
    if (mode !== 'exam' || !settings.strictExamMode) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timestamp = new Date().toLocaleTimeString();
        setExamViolations(prev => prev + 1);
        db.reviewLogs.add({
            conceptId: currentConcept?.id || 'cheat_log',
            rating: 0, // Flag as violation
            reviewTime: Date.now(),
            scheduledDays: 0,
            elapsedDays: 0,
            stability: 0,
            difficulty: 0,
            responseTime: 0
        });
        console.warn(`[${timestamp}] Backgrounding detected in Exam Mode`);
      }
    };

    const handleBlur = () => {
        if (settings.strictExamMode) {
            setExamViolations(prev => prev + 1);
            console.warn("Window focus lost (App switching attempt)");
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
    };
  }, [mode, settings.strictExamMode, currentConcept]);
  
  const currentQuestion = useLiveQuery(async () => {
    try {
      if (!currentConcept) return null;
      return await db.questions.where('conceptId').equals(currentConcept.id).first();
    } catch (e) {
      console.error("currentQuestion Query Error:", e);
      return null;
    }
  }, [currentConcept]);

  const options = useLiveQuery(async () => {
    try {
      if (!currentQuestion) return [];
      return await db.options.where('questionId').equals(currentQuestion.id).toArray();
    } catch (e) {
      console.error("options Query Error:", e);
      return [];
    }
  }, [currentQuestion]);

  // Shuffle options
  const shuffledOptions = useMemo(() => {
    if (!options) return [];
    return [...options].sort(() => Math.random() - 0.5);
  }, [options]);

  const handleOptionSelect = (id: string) => {
    if (isRevealed || isConfirmed) return;
    hapticFeedback('light');
    setSelectedOptionId(id);
    // REMOVED: Auto-confirm logic to strictly obey STEP 3 separate button model
  };

  const handleConfirm = async (id: string | null = selectedOptionId) => {
    if (!id || !currentQuestion) return;
    hapticFeedback('medium');
    setIsConfirmed(true);
    
    // Update Question Stats (Silent in Exam Mode)
    const selectedOption = shuffledOptions.find(o => o.id === id);
    const isCorrect = selectedOption?.isCorrect || false;
    
    await db.questions.update(currentQuestion.id, {
      solveCount: (currentQuestion.solveCount || 0) + 1,
      correctCount: (currentQuestion.correctCount || 0) + (isCorrect ? 1 : 0),
      wrongCount: (currentQuestion.wrongCount || 0) + (isCorrect ? 0 : 1),
      lastSeen: Date.now()
    });

    // In Exam Mode, NEVER show answer immediately
    if (mode !== 'exam' && settings.showAnswerImmediately) {
      setIsRevealed(true);
    }

    if (mode === 'exam' && settings.autoNext) {
        setTimeout(() => handleRate(3), 500);
    }
  };

  const handleRate = async (rating: number) => {
    if (!currentConcept) return;
    hapticFeedback(rating === 1 ? 'error' : 'success');

    const elapsed = Math.round((Date.now() - (currentConcept.lastReview || Date.now())) / (1000 * 60 * 60 * 24));
    const next = calculateNextState(
      currentConcept.stability,
      currentConcept.difficulty,
      Math.max(1, elapsed),
      rating,
      currentConcept.state
    );

    await db.concepts.update(currentConcept.id, {
      stability: next.stability,
      difficulty: next.difficulty,
      state: 2, // Review state
      lastReview: Date.now(),
      nextReview: Date.now() + (next.interval * 24 * 60 * 60 * 1000),
      reps: currentConcept.reps + 1,
      lapses: rating === 1 ? currentConcept.lapses + 1 : currentConcept.lapses,
      isLeech: (currentConcept.lapses + (rating === 1 ? 1 : 0)) >= 8 ? 1 : 0
    });

    await db.reviewLogs.add({
      conceptId: currentConcept.id,
      rating,
      responseTime: Date.now() - startTime,
      scheduledDays: next.interval,
      elapsedDays: elapsed,
      stability: next.stability,
      difficulty: next.difficulty,
      reviewTime: Date.now()
    });

    if (currentIndex + 1 < (dueConcepts?.length || 0)) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionId(null);
      setIsRevealed(false);
      setIsConfirmed(false);
      setStartTime(Date.now());
    } else {
      onFinish();
    }
  };

  if (!dueConcepts) return <div className="p-8 text-center dark:text-gray-400">Loading session...</div>;
  if (dueConcepts.length === 0) return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full gap-4 dark:bg-[#1B1B1F]">
      <Check className="w-12 h-12 text-green-500" />
      <h2 className="text-xl font-bold dark:text-white">Session Complete!</h2>
      <p className="text-gray-500 dark:text-gray-400">No more concepts due for review.</p>
      <button onClick={onBack} className="mt-4 text-[#0061A4] dark:text-[#D1E6FF] font-bold underline">Return Home</button>
    </div>
  );

  const progress = (currentIndex / dueConcepts.length) * 100;

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1B1B1F] sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          {mode !== 'exam' && (
            <button onClick={onBack} className="dark:text-[#E3E2E6] transition-all active:scale-90 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col flex-1">
             <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#0061A4] dark:text-[#D1E6FF]">
                    {Math.round(progress)}% Complete
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                    {currentIndex + 1} / {dueConcepts.length}
                </span>
             </div>
             <div className="h-1.5 bg-[#E0E2EC] dark:bg-[#44474E] rounded-full overflow-hidden">
               <div className="bg-[#0061A4] dark:bg-[#D1E6FF] h-full transition-all duration-700 ease-in-out" style={{ width: `${progress}%` }} />
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F2F7FF] dark:bg-[#001E2F] rounded-xl border border-[#D1E6FF] dark:border-[#004A77] shadow-sm">
          <Timer className="w-4 h-4 text-[#0061A4] dark:text-[#D1E6FF]" />
          <span className="text-xs font-black text-[#0061A4] dark:text-[#D1E6FF] tabular-nums font-mono">00:42:31</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col" style={{ gap: `${settings.questionSpacing}rem` }}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="text-[10px] font-bold text-[#0061A4] dark:text-[#D1E6FF] uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                    Q.{currentIndex + 1}
                </div>
                {currentConcept && (
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div 
                                key={i} 
                                className={`w-2 h-1 rounded-full ${i <= (currentConcept.stability / 10) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} 
                                title="Mastery Level"
                            />
                        ))}
                    </div>
                )}
            </div>
            {mode === 'exam' && examViolations > 0 && (
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Security Breach ({examViolations})
                </div>
            )}
        </div>

        <div className={`markdown-body dark:text-[#E3E2E6] question-title ${mode === 'exam' ? 'font-arial' : ''}`} style={{ fontSize: `${settings.fontSize}px` }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentQuestion?.text || ''}
          </ReactMarkdown>
        </div>

        <div className="flex flex-col gap-4">
          {shuffledOptions.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.isCorrect;
            
            let statusStyles = "border-[#E0E2EC] dark:border-[#44474E] bg-white dark:bg-gray-900 text-[#1B1B1F] dark:text-[#E3E2E6]";
            if (isRevealed) {
              if (isCorrect) statusStyles = "border-[#008A24] bg-[#F3FFF5] dark:bg-[#002206] text-[#00390B] dark:text-[#B4F0B7] border-2 shadow-sm font-bold";
              else if (isSelected && !isCorrect) statusStyles = "border-[#BA1A1A] bg-[#FFF8F7] dark:bg-[#410002] text-[#410002] dark:text-[#FFDAD6] border-2 shadow-sm font-bold";
              else if (isSelected) statusStyles = "border-[#0061A4] dark:border-[#D1E6FF] bg-[#F2F7FF] dark:bg-[#001E2F]";
            } else if (isSelected) {
              statusStyles = "border-[#0061A4] dark:border-[#D1E6FF] bg-[#F2F7FF] dark:bg-[#003350] border-2 ring-2 ring-[#0061A4]/20 ring-offset-1 dark:ring-offset-black font-bold";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt.id)}
                disabled={isRevealed || isConfirmed}
                className={`w-full p-5 text-left border rounded-2xl transition-all duration-200 active:scale-[0.99] flex justify-between items-center group ${statusStyles}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${isSelected ? 'bg-[#0061A4] border-[#0061A4] text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-[#0061A4]'}`}>
                        {String.fromCharCode(65 + shuffledOptions.indexOf(opt))}
                    </div>
                    <span className="option-text font-medium leading-tight">{opt.text}</span>
                </div>
                {isRevealed && isCorrect && <Check className="w-5 h-5 text-[#008A24]" />}
                {isRevealed && isSelected && !isCorrect && <X className="w-5 h-5 text-[#BA1A1A]" />}
              </button>
            );
          })}
        </div>

        {selectedOptionId && !isConfirmed && (
          <button 
            onClick={() => handleConfirm()}
            className="w-full py-5 bg-[#0061A4] dark:bg-[#D1E6FF] text-white dark:text-[#003258] rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-lg shadow-blue-200 dark:shadow-none animate-in fade-in slide-in-from-bottom-4 transition-all active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            FINAL CONFIRMATION
          </button>
        )}

        {isRevealed && mode !== 'exam' && (
          <div className="mt-4 p-4 bg-[#F2F7FF] dark:bg-[#001E2F] rounded-2xl border border-[#D1E6FF] dark:border-[#004A77] animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-[10px] font-extrabold text-[#0061A4] dark:text-[#D1E6FF] uppercase mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Explanation
            </h4>
            <div className="markdown-body text-xs leading-relaxed text-[#44474E] dark:text-[#C0C7D5]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion?.explanation || ''}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 bg-white dark:bg-[#1B1B1F] border-t border-[#E0E2EC] dark:border-[#44474E]">
        {(!isConfirmed && !isRevealed) ? (
          <p className="text-center text-[10px] text-[#535F70] dark:text-[#C0C7D5] uppercase font-bold tracking-widest opacity-60">
            {mode === 'exam' ? 'Exam in progress • Confirm choice to proceed' : 'Select an option to confirm choice'}
          </p>
        ) : (isConfirmed && !isRevealed && mode !== 'exam') ? (
          <button 
            onClick={() => setIsRevealed(true)}
            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-[#1B1B1F] dark:text-white rounded-2xl font-bold uppercase tracking-widest"
          >
            Show Explanation
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            {settings.confidenceRatingEnabled && mode !== 'exam' && (
              <div className="flex gap-2">
                {[
                  { label: 'Again', color: 'bg-[#BA1A1A] text-white', val: 1 },
                  { label: 'Hard', color: 'bg-[#FFB4A9] text-[#410002] dark:bg-[#FFB4AB] dark:text-[#690005]', val: 2 },
                  { label: 'Good', color: 'bg-[#D1E6FF] text-[#001E2F] dark:bg-[#004A77] dark:text-[#D1E6FF]', val: 3 },
                  { label: 'Easy', color: 'bg-[#B4F0B7] text-[#002107] dark:bg-[#005314] dark:text-[#B4F0B7]', val: 4 },
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => handleRate(r.val)}
                    className={`flex-1 py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-transform active:scale-95 ${r.color}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            
            {(!settings.confidenceRatingEnabled || mode === 'exam') && (
              <button 
                onClick={() => handleRate(3)}
                className="w-full py-4 bg-[#0061A4] text-white rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Next Question
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
