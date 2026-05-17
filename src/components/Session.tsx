import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Concept, type Question, type Option } from '../lib/db';
import { calculateNextState } from '../lib/fsrs';
import { ChevronLeft, Info, Timer, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SessionProps {
  mode: 'practice' | 'revision' | 'exam';
  onFinish: () => void;
  onBack: () => void;
}

export default function Session({ mode, onFinish, onBack }: SessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  
  // Use live query to get due concepts
  const dueConcepts = useLiveQuery(() => {
    try {
      return db.concepts.where('nextReview').belowOrEqual(Date.now()).toArray();
    } catch (e) {
      console.error("dueConcepts Query Error:", e);
      return [];
    }
  });

  const currentConcept = dueConcepts?.[currentIndex];
  
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
    if (isRevealed) return;
    setSelectedOptionId(id);
    setIsRevealed(true);
  };

  const handleRate = async (rating: number) => {
    if (!currentConcept) return;

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
      <header className="p-4 flex items-center gap-4">
        <button onClick={onBack} className="dark:text-[#E3E2E6]"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex-1 h-1.5 bg-[#E0E2EC] dark:bg-[#44474E] rounded-full overflow-hidden">
          <div className="bg-[#0061A4] dark:bg-[#D1E6FF] h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#535F70] dark:text-[#C0C7D5]">
          <Timer className="w-3 h-3" />
          <span>00:42</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="text-xs font-bold text-[#0061A4] dark:text-[#D1E6FF] uppercase tracking-wider">
          {currentConcept?.name}
        </div>

        <div className="markdown-body dark:text-[#E3E2E6]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentQuestion?.text || ''}
          </ReactMarkdown>
        </div>

        <div className="flex flex-col gap-3">
          {shuffledOptions.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.isCorrect;
            
            let statusStyles = "border-[#E0E2EC] dark:border-[#44474E] bg-white dark:bg-gray-900 text-[#1B1B1F] dark:text-[#E3E2E6]";
            if (isRevealed) {
              if (isCorrect) statusStyles = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
              else if (isSelected && !isCorrect) statusStyles = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
              else if (isSelected) statusStyles = "border-[#0061A4] dark:border-[#D1E6FF] bg-[#F2F7FF] dark:bg-[#001E2F]";
            } else if (isSelected) {
              statusStyles = "border-[#0061A4] dark:border-[#D1E6FF] bg-[#F2F7FF] dark:bg-[#001E2F]";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt.id)}
                disabled={isRevealed}
                className={`w-full p-4 text-left border rounded-xl transition-all duration-200 active:scale-[0.99] flex justify-between items-center ${statusStyles}`}
              >
                <span className="text-sm font-medium">{opt.text}</span>
                {isRevealed && isCorrect && <Check className="w-4 h-4" />}
                {isRevealed && isSelected && !isCorrect && <X className="w-4 h-4" />}
              </button>
            );
          })}
        </div>

        {isRevealed && (
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
        {!isRevealed ? (
          <p className="text-center text-xs text-[#535F70] dark:text-[#C0C7D5] italic font-medium">Select an option to reveal answer</p>
        ) : (
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
      </footer>
    </div>
  );
}
