import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ChevronLeft, TrendingUp, Zap, Target, Book } from 'lucide-react';

export default function Stats({ onBack }: { onBack: () => void }) {
  const totalConcepts = useLiveQuery(() => db.concepts.count());
  const masteredConcepts = useLiveQuery(() => 
    db.concepts.where('stability').above(10).count()
  );
  const logs = useLiveQuery(() => db.reviewLogs.toArray());

  const avgRetention = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    const correct = logs.filter(l => l.rating > 1).length;
    return Math.round((correct / logs.length) * 100);
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFE] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center gap-4 bg-white dark:bg-[#1B1B1F] border-b border-[#E0E2EC] dark:border-[#44474E]">
        <button onClick={onBack} className="dark:text-[#E3E2E6]"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold tracking-tight dark:text-white">Statistics</h2>
      </header>

      <main className="p-6 overflow-y-auto flex flex-col gap-8">
        <section className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={<Target className="w-4 h-4 text-[#0061A4] dark:text-[#D1E6FF]" />}
            label="Mastery" 
            value={`${totalConcepts ? Math.round(((masteredConcepts || 0) / totalConcepts) * 100) : 0}%`} 
          />
          <StatCard 
            icon={<Zap className="w-4 h-4 text-orange-500" />}
            label="Retention" 
            value={`${avgRetention}%`} 
          />
          <StatCard 
            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
            label="Total Reviews" 
            value={logs?.length.toString() || '0'} 
          />
          <StatCard 
            icon={<Book className="w-4 h-4 text-purple-500" />}
            label="Total Concepts" 
            value={totalConcepts?.toString() || '0'} 
          />
        </section>

        <section>
          <h3 className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase mb-4">Retention Heatmap (Mock)</h3>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-[2px] ${i % 5 === 0 ? 'bg-[#0061A4] dark:bg-[#D1E6FF]' : i % 3 === 0 ? 'bg-[#D1E6FF] dark:bg-[#004A77]' : 'bg-gray-100 dark:bg-gray-800'}`}
              />
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-[#E0E2EC] dark:border-[#44474E]">
          <h3 className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase mb-4">Focus Area</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-1.5 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="w-[80%] h-full bg-[#0061A4] dark:bg-[#D1E6FF]" />
              </div>
              <span className="text-xs font-medium w-20 dark:text-[#E3E2E6]">Physics</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-1.5 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="w-[30%] h-full bg-orange-400" />
              </div>
              <span className="text-xs font-medium w-20 dark:text-[#E3E2E6]">Chemistry</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-[#E0E2EC] dark:border-[#44474E] flex flex-col gap-2 shadow-sm transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight dark:text-white">{value}</p>
    </div>
  );
}
