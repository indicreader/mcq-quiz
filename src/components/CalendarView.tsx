import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, Zap, Target, AlertCircle, Timer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Settings } from '../lib/settings';

export default function CalendarView({ settings, onBack }: { settings: Settings, onBack: () => void }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  const logs = useLiveQuery(() => db.reviewLogs.toArray()) || [];
  const conceptsCount = useLiveQuery(() => db.concepts.count()) || 0;
  
  const studyDates = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(log => {
      dates.add(new Date(log.reviewTime).toDateString());
    });
    return dates;
  }, [logs]);

  const todaySchedules = useMemo(() => {
    const day = new Date().getDay();
    return settings.schedules
      .filter(s => s.enabled && s.days.includes(day))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [settings.schedules]);

  const examStatus = useMemo(() => {
    if (!settings.examDate) return null;
    const exam = new Date(settings.examDate);
    const diff = exam.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return {
        days,
        isUrgent: days > 0 && days < 14,
        isOver: days < 0
    };
  }, [settings.examDate]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1B1B1F] sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#0061A4]" />
            Study Planner
          </h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Exam Countdown Banner */}
        {examStatus && !examStatus.isOver && (
            <section className={`p-6 rounded-3xl border ${examStatus.isUrgent ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${examStatus.isUrgent ? 'text-red-500' : 'text-[#0061A4]'}`}>
                            Target Engagement
                        </h4>
                        <p className="text-2xl font-black">{examStatus.days} Days Remaining</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${examStatus.isUrgent ? 'bg-red-500 text-white' : 'bg-[#0061A4] text-white'}`}>
                        <Timer className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black/5 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${examStatus.isUrgent ? 'bg-red-500' : 'bg-[#0061A4]'}`} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{examStatus.isUrgent ? 'Intensive Phase' : 'Stability Phase'}</span>
                    </div>
                </div>
            </section>
        )}

        {/* Today's Agenda */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today's Agenda</h4>
              <span className="text-[10px] font-bold text-[#0061A4] dark:text-blue-200">{todaySchedules.length} Scheduled</span>
           </div>
           <div className="space-y-3">
              {todaySchedules.length > 0 ? todaySchedules.map(s => (
                  <div key={s.id} className="group p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm hover:border-[#0061A4]/30 transition-all">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${s.type === 'TEST' ? 'bg-red-50 text-red-600' : s.type === 'REVISION' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {s.type === 'TEST' ? <Zap className="w-5 h-5" /> : s.type === 'REVISION' ? <Clock className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                          </div>
                          <div>
                              <p className="text-xs font-black uppercase tracking-tight">{s.type} SESSION</p>
                              <p className="text-[10px] text-gray-400 font-bold">{s.time} • Local Time</p>
                          </div>
                      </div>
                      <button className="text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-[#0061A4] transition-colors">
                          PRE-FLIGHT
                      </button>
                  </div>
              )) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Reserving cycles for study</p>
                  </div>
              )}
           </div>
        </section>

        {/* Monthly Calendar View */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black tracking-tight">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
             <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                   onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                   className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-gray-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
              
              const isToday = date.toDateString() === new Date().toDateString();
              const hasStudied = studyDates.has(date.toDateString());
              
              return (
                <div 
                  key={i} 
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group ${isToday ? 'bg-[#0061A4] text-white shadow-lg shadow-blue-200' : hasStudied ? 'bg-blue-50 dark:bg-[#003350] text-[#0061A4] dark:text-blue-100' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="text-xs font-bold">{date.getDate()}</span>
                  {hasStudied && !isToday && (
                      <div className="w-1 h-1 bg-[#0061A4] dark:bg-blue-300 rounded-full mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* History Hook */}
        <section className="space-y-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Consistency Log</h4>
           <div className="space-y-3">
              {logs.slice(-3).reverse().map(log => (
                  <div key={log.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${log.rating >= 4 ? 'bg-green-50' : 'bg-orange-50'}`}>
                              <CheckCircle2 className={`w-4 h-4 ${log.rating >= 4 ? 'text-green-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                              <p className="text-xs font-black uppercase tracking-tight">Review Session</p>
                              <p className="text-[10px] text-gray-400 font-bold">{new Date(log.reviewTime).toLocaleDateString()} • {log.responseTime}ms</p>
                          </div>
                      </div>
                  </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
}
