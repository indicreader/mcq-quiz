import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Deck } from '../lib/db';
import { Menu, Flame, Play, BarChart2, BookOpen, AlertCircle, Settings, Zap, Hash, Calendar, Clock, PlusCircle, ChevronLeft } from 'lucide-react';
import { Settings as AppSettings } from '../lib/settings';
import { hapticFeedback } from '../lib/haptics';

interface HomeProps {
  selectedDeck?: Deck;
  settings: AppSettings;
  onOpenMenu: () => void;
  onStartSession: (mode: 'practice' | 'revision' | 'exam', params?: { questionLimit?: number; timeLimit?: number }) => void;
  onViewStats: () => void;
  onOpenSettings: () => void;
  onAddQuestion: () => void;
  onViewCalendar: () => void;
}

export default function Home({ selectedDeck, settings, onOpenMenu, onStartSession, onViewStats, onOpenSettings, onAddQuestion, onViewCalendar }: HomeProps) {
  const [showExamPicker, setShowExamPicker] = React.useState(false);
  
  const handleStartSession = (mode: 'practice' | 'revision' | 'exam', params?: { questionLimit?: number; timeLimit?: number }) => {
    hapticFeedback('medium');
    if (mode === 'exam' && !showExamPicker && !params) {
      setShowExamPicker(true);
      return;
    }
    onStartSession(mode, params);
  };
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

  const activeSchedule = useMemo(() => {
    const today = new Date().getDay();
    return settings.schedules
      .filter(s => s.enabled && s.days.includes(today))
      .sort((a, b) => {
        const [ah, am] = a.time.split(':').map(Number);
        const [bh, bm] = b.time.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      })[0];
  }, [settings.schedules]);

  const isPreExam = useMemo(() => {
    if (!settings.examDate) return false;
    const examDate = new Date(settings.examDate);
    const diff = examDate.getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000; // 14 days before
  }, [settings.examDate]);



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
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                {selectedDeck ? 'Single Subject' : 'Master Deck'}
                </span>
                {isPreExam && (
                    <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">PRE-EXAM PHASE</span>
                )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onViewCalendar}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full transition-all active:scale-95"
            title="Study Calendar"
          >
            <Calendar className="w-5 h-5 text-gray-400" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full transition-all active:scale-95"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2 bg-[#F4F4F9] dark:bg-gray-800 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-semibold dark:text-white">7</span>
          </div>
        </div>
      </header>

      <section className="bg-[#F3FFF5] dark:bg-[#002206] p-6 rounded-3xl border border-[#008A24]/30 dark:border-[#B4F0B7]/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-24 h-24 text-[#008A24] dark:text-[#B4F0B7]" />
        </div>
        <h3 className="text-xs font-black text-[#008A24] dark:text-[#B4F0B7] tracking-widest uppercase mb-1">Active Protocol</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-black tracking-tighter dark:text-white">{dueCount ?? 0}</span>
          <span className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-widest">Pending</span>
        </div>
        
        <div className="w-full bg-[#E0E2EC] dark:bg-[#44474E] h-1.5 rounded-full overflow-hidden mb-4">
          <div className="bg-[#008A24] dark:bg-[#B4F0B7] h-full transition-all duration-1000" style={{ width: dueCount ? `${Math.min(100, (dueCount/50)*100)}%` : '5%' }} />
        </div>

        {activeSchedule && (
            <div className="flex items-center gap-4 pt-3 border-t border-[#008A24]/20 dark:border-[#B4F0B7]/20">
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-[#008A24] dark:text-[#B4F0B7]" />
                    <span className="text-[10px] font-black dark:text-green-100 uppercase">{activeSchedule.time}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-[#008A24] dark:text-[#B4F0B7]" />
                    <span className="text-[10px] font-black dark:text-green-100 uppercase">{activeSchedule.type}</span>
                </div>
            </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onViewStats}
          className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-[#E0E2EC] dark:border-[#44474E] text-left transition-all active:scale-95 shadow-sm"
        >
          <span className="text-[9px] font-black text-[#535F70] dark:text-[#C0C7D5] uppercase block mb-2 tracking-widest">Mastery</span>
          <div className="flex items-end gap-1">
            <p className="text-2xl font-black dark:text-white">64.2</p>
            <span className="text-[10px] font-bold text-green-500 mb-1.5">%</span>
          </div>
        </button>
        <button 
          onClick={() => handleStartSession('practice')}
          className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-[#E0E2EC] dark:border-[#44474E] text-left transition-all active:scale-95 shadow-sm"
        >
          <span className="text-[9px] font-black text-[#535F70] dark:text-[#C0C7D5] uppercase block mb-2 tracking-widest">Velocity</span>
          <div className="flex items-end gap-1">
            <p className="text-2xl font-black dark:text-white">12</p>
            <span className="text-[10px] font-bold text-blue-500 mb-1.5">Q/H</span>
          </div>
        </button>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase">Weekly Goal</h3>
          <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded uppercase">ON TRACK</span>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto pb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
                    <span className="text-[9px] font-bold text-gray-400">{day}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${i < 4 ? 'bg-[var(--m3-primary-container)] border-[var(--m3-primary)] dark:bg-[#004A77]' : 'bg-transparent border-gray-100 dark:border-gray-800'}`}>
                        {i < 4 && <Zap className="w-3 h-3 text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)]" />}
                    </div>
                </div>
            ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase">Weak Concepts</h3>
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
          onClick={() => handleStartSession('revision')}
          className="w-full bg-[var(--m3-primary)] dark:bg-[var(--m3-primary-container)] text-white dark:text-[#003258] py-5 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:brightness-110"
        >
          <Play className="w-5 h-5 fill-current" />
          START SESSION
        </button>
        <div className="flex gap-3">
           <button 
             onClick={() => handleStartSession('exam')}
             className="flex-1 bg-white dark:bg-gray-800 text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] py-3 font-semibold text-sm hover:brightness-95 rounded-xl transition-colors border border-[var(--m3-primary-container)] dark:border-[#004A77] flex items-center justify-center gap-2"
           >
             <Zap className="w-4 h-4" />
             EXAM MODE
           </button>
          <button 
            onClick={onAddQuestion}
            className="flex-1 bg-white dark:bg-gray-800 text-[var(--m3-primary)] dark:text-[var(--m3-primary-container)] py-3 font-semibold text-sm hover:brightness-95 rounded-xl transition-colors border border-[var(--m3-primary-container)] dark:border-[#004A77] flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            ADD TOPIC
          </button>
        </div>
      </div>

      {showExamPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowExamPicker(false)}
              />
              <div className="bg-white dark:bg-[#1B1B1F] w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-black text-[#1B1B1F] dark:text-white mb-2 uppercase tracking-tight">Select Exam Pattern</h3>
                  <p className="text-xs text-gray-500 mb-6 font-medium">Standardized configurations for realistic practice sessions.</p>
                  
                  <div className="space-y-3">
                      {[
                          { title: 'Mini Mock', icon: <Zap className="w-4 h-4" />, qs: 10, time: 10, color: 'bg-blue-50 text-blue-600' },
                          { title: 'Standard Mock', icon: <Play className="w-4 h-4" />, qs: 50, time: 60, color: 'bg-purple-50 text-purple-600' },
                          { title: 'Full Marathon', icon: <Flame className="w-4 h-4" />, qs: 100, time: 120, color: 'bg-orange-50 text-orange-600' },
                          { title: 'Custom Blast', icon: <Settings className="w-4 h-4" />, qs: 0, time: 0, color: 'bg-gray-50 text-gray-600' },
                      ].map((p, i) => (
                          <button
                            key={i}
                            onClick={() => handleStartSession('exam', p.qs > 0 ? { questionLimit: p.qs, timeLimit: p.time } : undefined)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${p.color}`}>{p.icon}</div>
                                  <div className="text-left">
                                      <span className="text-sm font-bold block dark:text-white">{p.title}</span>
                                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{p.qs > 0 ? `${p.qs} Qs / ${p.time} Mins` : 'Manual Configuration'}</span>
                                  </div>
                              </div>
                              <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
                          </button>
                      ))}
                  </div>
                  
                  <button 
                    onClick={() => setShowExamPicker(false)}
                    className="mt-6 w-full py-4 text-xs font-black text-gray-400 uppercase tracking-widest"
                  >
                      Cancel Protocol
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
