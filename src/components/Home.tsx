import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Deck } from '../lib/db';
import { Menu, Flame, Play, BarChart2, BookOpen, AlertCircle, Settings, Zap, Hash } from 'lucide-react';

interface HomeProps {
  selectedDeck?: Deck;
  onOpenMenu: () => void;
  onStartSession: (mode: 'practice' | 'revision' | 'exam') => void;
  onViewStats: () => void;
  onOpenSettings: () => void;
  onAddQuestion: () => void;
}

export default function Home({ selectedDeck, onOpenMenu, onStartSession, onViewStats, onOpenSettings, onAddQuestion }: HomeProps) {
  const dueCount = useLiveQuery(async () => {
    try {
      if (selectedDeck) {
        const subjects = await db.subjects.where('deckId').equals(selectedDeck.id).toArray();
        const subjectIds = subjects.map(s => s.id);
        const topics = await db.topics.where('subjectId').anyOf(subjectIds).toArray();
        const topicIds = topics.map(t => t.id);
        
        return db.concepts
          .where('nextReview').belowOrEqual(Date.now())
          .filter(c => topicIds.includes(c.topicId))
          .count();
      }
      return db.concepts.where('nextReview').belowOrEqual(Date.now()).count();
    } catch (e) {
      return 0;
    }
  }, [selectedDeck]);

  const weakConcepts = useLiveQuery(async () => {
    try {
      if (selectedDeck) {
        const subjects = await db.subjects.where('deckId').equals(selectedDeck.id).toArray();
        const subjectIds = subjects.map(s => s.id);
        const topics = await db.topics.where('subjectId').anyOf(subjectIds).toArray();
        const topicIds = topics.map(t => t.id);

        return db.concepts
          .where('isLeech').equals(1)
          .filter(c => topicIds.includes(c.topicId))
          .limit(3)
          .toArray();
      }
      return db.concepts.where('isLeech').equals(1).limit(3).toArray();
    } catch (e) {
      return [];
    }
  }, [selectedDeck]);

  const isLoading = dueCount === undefined;

  return (
    <div className="p-6 flex flex-col h-full gap-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenMenu}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6 text-[#1B1B1F] dark:text-[#E3E2E6]" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-[#1B1B1F] dark:text-[#E3E2E6]">
              {selectedDeck ? selectedDeck.name : 'mcq-prep'}
            </h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              {selectedDeck ? 'Single Subject' : 'Master Deck'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F4F4F9] dark:bg-gray-800 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-semibold dark:text-white">7</span>
          </div>
          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6 text-[#535F70] dark:text-[#C0C7D5]" />
          </button>
        </div>
      </header>

      <section className="bg-[#F2F7FF] dark:bg-[#001E2F] p-6 rounded-3xl border border-[#D1E6FF] dark:border-[#004A77]">
        <h3 className="text-xs font-bold text-[#0061A4] dark:text-[#D1E6FF] tracking-widest uppercase mb-1">Due Today</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-medium tracking-tighter dark:text-white">{dueCount ?? 0}</span>
          <span className="text-lg text-[#535F70] dark:text-[#C0C7D5]">Concepts</span>
        </div>
        
        <div className="w-full bg-[#E0E2EC] dark:bg-[#44474E] h-2 rounded-full overflow-hidden mb-2">
          <div className="bg-[#0061A4] dark:bg-[#D1E6FF] h-full transition-all duration-1000" style={{ width: dueCount ? '30%' : '0%' }} />
        </div>
        <p className="text-xs text-[#535F70] dark:text-[#C0C7D5]">12 reviewed of 42 total</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FAFAFE] dark:bg-gray-900 p-4 rounded-2xl border border-[#E0E2EC] dark:border-[#44474E]">
          <span className="text-[10px] font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase">Mastery</span>
          <p className="text-xl font-semibold dark:text-white">64%</p>
        </div>
        <div className="bg-[#FAFAFE] dark:bg-gray-900 p-4 rounded-2xl border border-[#E0E2EC] dark:border-[#44474E]">
          <span className="text-[10px] font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase">Focus</span>
          <p className="text-xl font-semibold dark:text-white">Technical</p>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase">Weak Concepts</h3>
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] dark:text-[#FFB4AB]" />
        </div>
        <div className="space-y-3">
          {weakConcepts?.length ? weakConcepts.map(c => (
            <div key={c.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-[#E0E2EC] dark:border-[#44474E]">
              <span className="text-sm font-medium dark:text-white">{c.name}</span>
              <span className="text-xs font-bold text-[#BA1A1A] dark:text-[#FFB4AB]">42%</span>
            </div>
          )) : (
            <p className="text-sm text-gray-400 italic">No leeches detected yet.</p>
          )}
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <button 
          onClick={() => onStartSession('revision')}
          className="w-full bg-[#0061A4] dark:bg-[#D1E6FF] text-white dark:text-[#003258] py-5 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:brightness-110"
        >
          <Play className="w-5 h-5 fill-current" />
          START SESSION
        </button>
        <div className="flex gap-3">
          <button 
            onClick={onViewStats}
            className="flex-1 text-[#0061A4] dark:text-[#D1E6FF] py-3 font-semibold text-sm hover:bg-[#F2F7FF] dark:hover:bg-[#001E2F] rounded-xl transition-colors border border-[#D1E6FF] dark:border-[#004A77]"
          >
            STATISTICS
          </button>
          <button 
            onClick={onAddQuestion}
            className="flex-1 bg-[#F2F7FF] dark:bg-[#001E2F] text-[#0061A4] dark:text-[#D1E6FF] py-3 font-semibold text-sm hover:brightness-95 rounded-xl transition-colors border border-[#D1E6FF] dark:border-[#004A77] flex items-center justify-center gap-2"
          >
            ADD QUESTION
          </button>
        </div>
      </div>
    </div>
  );
}
