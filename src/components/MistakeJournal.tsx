import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ChevronLeft, AlertCircle, TrendingDown, BookOpen } from 'lucide-react';

export default function MistakeJournal({ onBack }: { onBack: () => void }) {
  const mistakes = useLiveQuery(() => 
    db.questions.where('wrongCount').above(0).toArray()
  ) || [];

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold dark:text-white">Mistake Journal</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#0061A4]" />
            </div>
            <h3 className="text-lg font-bold dark:text-white">All Clear!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your journal is empty. Keep up the high accuracy.</p>
          </div>
        ) : (
          mistakes.map(q => (
            <div key={q.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">High Frequency Error</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                  <TrendingDown className="w-3 h-3" />
                  <span>{q.wrongCount} WRONG</span>
                </div>
              </div>
              <p className="text-sm font-medium mb-3 line-clamp-3 dark:text-gray-300">{q.text}</p>
              <div className="flex flex-wrap gap-1">
                {q.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-500 uppercase">{t}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
