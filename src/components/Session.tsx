import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Concept, type Question, type Option } from '../lib/db';
import { calculateNextState } from '../lib/fsrs';
import { ChevronLeft, Info, Timer, Check, X, ShieldCheck, AlertCircle, Zap, Target, Clock, Flame } from 'lucide-react';
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
  questionLimit?: number;
  timeLimit?: number; // in minutes
}

export default function Session({ mode, deckId, onFinish, onBack, settings, questionLimit: initialLimit, timeLimit: initialTimeLimit }: SessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const [examViolations, setExamViolations] = useState(0);
  
  const [setupMode, setSetupMode] = useState(mode === 'exam' && !initialLimit);
  const [questionLimit, setQuestionLimit] = useState(initialLimit);
  const [timeLimit, setTimeLimit] = useState(initialTimeLimit);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (timeLimit && !setupMode) {
      setTimeLeft(timeLimit * 60);
    }
  }, [timeLimit, setupMode]);

  // Use live query to get due concepts
  const dueConcepts = useLiveQuery(async () => {
    if (setupMode) return null;
    try {
      let results;
      if (mode === 'exam') {
        // Exam mode pulls all questions from deck
        const subjects = await db.subjects.where('deckId').equals(deckId || '').toArray();
        const subjectIds = subjects.map(s => s.id);
        const topics = await db.topics.where('subjectId').anyOf(subjectIds).toArray();
        const topicIds = topics.map(t => t.id);
        results = await db.concepts.where('topicId').anyOf(topicIds).toArray();
        
        // Apply limit and shuffle
        results = results.sort(() => Math.random() - 0.5);
        if (questionLimit) {
          results = results.slice(0, questionLimit);
        }
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

        // Adaptive Weak-Question Prioritization
        if (settings.adaptivePrioritization) {
          results.sort((a, b) => {
            // Priority 1: High lapses
            if (a.lapses !== b.lapses) return b.lapses - a.lapses;
            // Priority 2: Lower stability
            return a.stability - b.stability;
          });
        }
      }
      
      return results;
    } catch (e) {
      console.error("dueConcepts Query Error:", e);
      return [];
    }
  }, [deckId, mode, questionLimit, setupMode]);

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

  // Backgrounding detection (Anti-Cheat / Focus Protection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timestamp = new Date().toLocaleTimeString();
        
        if (mode === 'exam' && settings.strictUninterruptedMode) {
          setExamViolations(prev => prev + 1);
          console.warn(`[${timestamp}] Backgrounding detected in Exam Mode`);
        }

        if (mode === 'practice' && settings.pauseOnMinimize) {
           // If we had a pause state, we'd trigger it here.
           // For now, we'll just log it or notify the user.
           console.log("Practice session paused due to minimization");
        }
      }
    };

    const handleBlur = () => {
        if (mode === 'exam' && settings.strictUninterruptedMode) {
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
  }, [mode, settings.strictUninterruptedMode, currentConcept]);
  
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

    // Handle Answer Verification Logic
    const timing = settings.answerTiming;
    const expMode = settings.explanationMode;

    if (mode !== 'exam') {
      if (timing === 'IMMEDIATE') {
        setIsRevealed(true);
      }
      
      if (settings.autoNext && timing === 'IMMEDIATE') {
        setTimeout(() => {
          if (settings.confidenceRatingEnabled) {
            // Wait for rating
          } else {
            handleRate(isCorrect ? 3 : 1);
          }
        }, 1200); // UI delay for observation
      }
    }

    if (mode === 'exam' && settings.autoNext) {
        setTimeout(() => handleRate(3), 800);
    }
  };

  const handleRate = async (rating: number) => {
    if (!currentConcept) return;
    hapticFeedback(rating === 1 ? 'error' : 'success');

    // Mastery Threshold Logic
    const elapsed = Math.round((Date.now() - (currentConcept.lastReview || Date.now())) / (1000 * 60 * 60 * 24));
    const next = calculateNextState(
      currentConcept.stability,
      currentConcept.difficulty,
      Math.max(1, elapsed),
      rating,
      currentConcept.state
    );

    // If Mastery Threshold enabled and reached, handle suspension
    const willMaster = next.stability >= (settings.masteryThreshold * 100);
    const shouldSuspend = settings.suspendMastered && willMaster;

    await db.concepts.update(currentConcept.id, {
      stability: next.stability,
      difficulty: next.difficulty,
      state: shouldSuspend ? 0 : 2, // Reset or mark as mastered? 
      lastReview: Date.now(),
      nextReview: shouldSuspend ? Date.now() + (365 * 24 * 60 * 60 * 1000) : Date.now() + (next.interval * 24 * 60 * 60 * 1000),
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

  const [tick, setTick] = useState(0);

  // Timer logic
  useEffect(() => {
    let timer: number;
    
    if (timeLeft !== null) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      timer = window.setInterval(() => {
        setTick(t => t + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft === null, onFinish]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

  if (setupMode) {
    return (
      <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F] p-8">
          <header className="mb-12 flex items-center gap-4">
              <button onClick={onBack} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <ChevronLeft className="w-6 h-6 dark:text-white" />
              </button>
              <div className="flex flex-col">
                  <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Exam Prep</h2>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Setup</span>
              </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto pb-24 no-scrollbar">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Standardized Patterns</h3>
                  <div className="grid grid-cols-1 gap-3">
                      {[
                          { name: 'Mini Mock', qs: 10, time: 10, icon: <Zap className="w-4 h-4 text-blue-500" /> },
                          { name: 'Practice Mock', qs: 25, time: 30, icon: <Target className="w-4 h-4 text-emerald-500" /> },
                          { name: 'Standard Exam', qs: 50, time: 60, icon: <Clock className="w-4 h-4 text-purple-500" /> },
                          { name: 'Grand Marathon', qs: 100, time: 120, icon: <Flame className="w-4 h-4 text-orange-500" /> }
                      ].map(p => (
                          <button
                              key={p.name}
                              onClick={() => {
                                  setQuestionLimit(p.qs);
                                  setTimeLimit(p.time);
                                  setSetupMode(false);
                              }}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group active:scale-95 border border-transparent hover:border-blue-100"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">{p.icon}</div>
                                  <div className="text-left">
                                      <span className="text-sm font-bold block dark:text-white">{p.name}</span>
                                      <span className="text-[10px] text-gray-500 font-bold uppercase">{p.qs} Qs • {p.time} Mins</span>
                                  </div>
                              </div>
                              <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 group-hover:text-blue-500 transition-colors" />
                          </button>
                      ))}
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Custom Protocol</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Question Count</span>
                           </div>
                           <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="5" max="200" step="5"
                                value={questionLimit || 20}
                                onChange={(e) => setQuestionLimit(parseInt(e.target.value) || 20)}
                                className="w-20 bg-white dark:bg-black p-2 rounded text-xs font-black text-[var(--m3-primary)] border border-gray-200 dark:border-gray-700 text-right outline-none focus:border-[var(--m3-primary)]"
                            />
                           </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Time (Minutes)</span>
                           </div>
                           <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="5" max="240" step="5"
                                value={timeLimit || 30}
                                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                                className="w-20 bg-white dark:bg-black p-2 rounded text-xs font-black text-[var(--m3-primary)] border border-gray-200 dark:border-gray-700 text-right outline-none focus:border-[var(--m3-primary)]"
                            />
                           </div>
                        </div>
                  </div>
              </div>
          </div>

          <button
              onClick={() => setSetupMode(false)}
              className="w-full py-5 bg-[var(--m3-primary)] text-white rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
          >
              INITIATE CUSTOM EXAM
          </button>
      </div>
    );
  }

  if (dueConcepts === null || dueConcepts === undefined) return <div className="p-8 text-center dark:text-gray-400">Loading session...</div>;
  if (dueConcepts.length === 0) return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full gap-4 dark:bg-[#1B1B1F]">
      <Check className="w-12 h-12 text-green-500" />
      <h2 className="text-xl font-bold dark:text-white">Session Complete!</h2>
      <p className="text-gray-500 dark:text-gray-400">No more concepts due for review.</p>
      <button onClick={onBack} className="mt-4 text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] font-bold underline">Return Home</button>
    </div>
  );

  const progress = (currentIndex / dueConcepts.length) * 100;

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1B1B1F] sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => {
            const message = mode === 'exam' 
              ? "Are you sure you want to end the exam early? Progress will not be saved."
              : "Are you sure you want to exit the session? Your progress in this session will be preserved.";
            if (window.confirm(message)) {
              onBack();
            }
          }} className="dark:text-[#E3E2E6] transition-all active:scale-90 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col flex-1">
             <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)]">
                    {Math.round(progress)}% Complete
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                    {currentIndex + 1} / {dueConcepts.length}
                </span>
             </div>
             <div className="h-1.5 bg-[#E0E2EC] dark:bg-[#44474E] rounded-full overflow-hidden">
               <div className="bg-[var(--m3-primary)] dark:bg-[var(--m3-primary-container)] h-full transition-all duration-700 ease-in-out" style={{ width: `${progress}%` }} />
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F2F7FF] dark:bg-[#001E2F] rounded-xl border border-[var(--m3-primary-container)] dark:border-[#004A77] shadow-sm">
          <Timer className="w-4 h-4 text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)]" />
          <span className="text-xs font-black text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] tabular-nums font-mono">
            {timeLeft !== null ? formatTime(timeLeft) : formatTime(elapsedSeconds)}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col" style={{ gap: `${settings.questionSpacing}rem` }}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="text-[10px] font-bold text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
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
              else if (isSelected) statusStyles = "border-[var(--m3-primary)] dark:border-[var(--m3-primary-container)] bg-[#F2F7FF] dark:bg-[#001E2F]";
            } else if (isSelected) {
              statusStyles = "border-[var(--m3-primary)] dark:border-[var(--m3-primary-container)] bg-[#F2F7FF] dark:bg-[#003350] border-2 ring-2 ring-[var(--m3-primary)]/20 ring-offset-1 dark:ring-offset-black font-bold";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt.id)}
                disabled={isRevealed || isConfirmed}
                className={`w-full p-5 text-left border rounded-2xl transition-all duration-200 active:scale-[0.99] flex justify-between items-center group ${statusStyles}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${isSelected ? 'bg-[var(--m3-primary)] border-[var(--m3-primary)] text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-[var(--m3-primary)]'}`}>
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
            className="w-full py-5 bg-[var(--m3-primary)] dark:bg-[var(--m3-primary-container)] text-white dark:text-[#003258] rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-lg shadow-blue-200 dark:shadow-none animate-in fade-in slide-in-from-bottom-4 transition-all active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            FINAL CONFIRMATION
          </button>
        )}

        {isRevealed && mode !== 'exam' && settings.explanationMode !== 'DISABLED' && (
          <div className="mt-4 p-4 bg-[#F2F7FF] dark:bg-[#001E2F] rounded-2xl border border-[var(--m3-primary-container)] dark:border-[#004A77] animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-[10px] font-extrabold text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] uppercase mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Explanation 
              {settings.explanationMode === 'DELAYED' && <span className="text-[8px] opacity-60 ml-1">(Delayed Mode)</span>}
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
            {mode !== 'exam' && (() => {
              const selectedOption = shuffledOptions.find(o => o.id === selectedOptionId);
              const isCorrect = selectedOption?.isCorrect || false;

              if (isCorrect) {
                return (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRate(2)}
                      className="flex-1 py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-transform active:scale-95 bg-[#FFB4A9] text-[#410002] dark:bg-[#FFB4AB] dark:text-[#690005]"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleRate(4)}
                      className="flex-1 py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-transform active:scale-95 bg-[#B4F0B7] text-[#002107] dark:bg-[#005314] dark:text-[#B4F0B7]"
                    >
                      Easy
                    </button>
                  </div>
                );
              } else {
                return (
                  <button 
                    onClick={() => handleRate(1)}
                    className="w-full py-4 bg-[var(--m3-primary)] text-[var(--m3-on-primary)] rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    Next Question
                  </button>
                );
              }
            })()}
            
            {mode === 'exam' && (
              <button 
                onClick={() => handleRate(3)}
                className="w-full py-4 bg-[var(--m3-primary)] text-[var(--m3-on-primary)] rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95"
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
