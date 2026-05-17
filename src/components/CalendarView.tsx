import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export default function CalendarView({ onBack }: { onBack: () => void }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  const logs = useLiveQuery(() => db.reviewLogs.toArray()) || [];
  
  const studyDates = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(log => {
      dates.add(new Date(log.reviewTime).toDateString());
    });
    return dates;
  }, [logs]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
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

        <section className="space-y-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">History & Consistency</h4>
           <div className="space-y-3">
              {logs.slice(-5).reverse().map(log => (
                  <div key={log.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${log.rating >= 4 ? 'bg-green-50' : 'bg-orange-50'}`}>
                              <CheckCircle2 className={`w-4 h-4 ${log.rating >= 4 ? 'text-green-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                              <p className="text-xs font-black uppercase tracking-tight">Review Session</p>
                              <p className="text-[10px] text-gray-400 font-bold">{new Date(log.reviewTime).toLocaleString()}</p>
                          </div>
                      </div>
                      <div className="text-[10px] font-black bg-gray-50 dark:bg-black px-2 py-1 rounded-md text-gray-500">
                          {log.responseTime}ms
                      </div>
                  </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
}
