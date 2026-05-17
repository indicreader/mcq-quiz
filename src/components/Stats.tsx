import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ChevronLeft, TrendingUp, Zap, Target, Book, Activity, AlertCircle, Award, BarChart3, Clock } from 'lucide-react';
import { getEarnedBadges } from '../lib/gamification';

export default function Stats({ onBack }: { onBack: () => void }) {
  const totalConcepts = useLiveQuery(() => db.concepts.count());
  const masteredConcepts = useLiveQuery(() => 
    db.concepts.where('stability').above(10).count()
  );
  const logs = useLiveQuery(() => db.reviewLogs.toArray()) || [];

  const earnedBadges = useMemo(() => {
    return getEarnedBadges(logs, totalConcepts || 0);
  }, [logs, totalConcepts]);

  const weeklyStats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekLogs = logs.filter(l => l.reviewTime > oneWeekAgo);
    const uniqueDays = new Set(weekLogs.map(l => new Date(l.reviewTime).toDateString())).size;
    const avgResponse = weekLogs.length ? weekLogs.reduce((acc, l) => acc + l.responseTime, 0) / weekLogs.length : 0;
    
    return {
        count: weekLogs.length,
        days: uniqueDays,
        speed: Math.round(avgResponse),
        concepts: new Set(weekLogs.map(l => l.conceptId)).size
    };
  }, [logs]);

  const avgRetention = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    const correct = logs.filter(l => l.rating > 1).length;
    return Math.round((correct / logs.length) * 100);
  }, [logs]);

  const questions = useLiveQuery(() => db.questions.toArray()) || [];
  
  // Real Heatmap Logic (90 Days)
  const heatmapData90 = useMemo(() => {
    if (!logs) return [];
    const counts: Record<string, number> = {};
    const now = new Date();
    // last 90 days (18 columns * 5/7 rows approximately)
    // We'll just provide a flat array and let grid handle it
    for (let i = 0; i < 90; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        counts[d.toDateString()] = 0;
    }
    
    logs.forEach(l => {
        const dateStr = new Date(l.reviewTime).toDateString();
        if (counts[dateStr] !== undefined) counts[dateStr]++;
    });
    
    return Object.values(counts).reverse();
  }, [logs]);

  // Focus Area Logic
  const subjectPerformance = useMemo(() => {
    if (!questions.length) return [];
    // This is a simplification since we don't have direct subject link in questions
    // In a real app we'd join, but for now let's use tags as proxies or mock better
    return [
        { name: 'Physics', score: 85 },
        { name: 'Chemistry', score: 45 },
        { name: 'Biology', score: 65 }
    ].sort((a, b) => a.score - b.score);
  }, [questions]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFE] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center gap-4 bg-white dark:bg-[#1B1B1F] border-b border-[#E0E2EC] dark:border-[#44474E]">
        <button onClick={onBack} className="dark:text-[#E3E2E6]"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold tracking-tight dark:text-white">Statistics</h2>
      </header>

      <main className="p-6 overflow-y-auto flex flex-col gap-8">
        {/* Weekly Summary */}
        <section className="bg-gradient-to-br from-[#0061A4] to-[#004A77] p-6 rounded-3xl text-white shadow-xl">
           <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Weekly Pulse</span>
                </div>
                <div className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-lg">LIVE OPS</div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Throughput</span>
                  <p className="text-2xl font-black">{weeklyStats.count} <span className="text-[10px] text-blue-300">items</span></p>
              </div>
              <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Consistency</span>
                  <p className="text-2xl font-black">{weeklyStats.days} <span className="text-[10px] text-blue-300">days</span></p>
              </div>
              <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Mean Speed</span>
                  <p className="text-2xl font-black">{weeklyStats.speed} <span className="text-[10px] text-blue-300">ms</span></p>
              </div>
              <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Mastery Drift</span>
                  <p className="text-2xl font-black">+{weeklyStats.concepts} <span className="text-[10px] text-blue-300">topics</span></p>
              </div>
           </div>
        </section>

        {/* Badges Section */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="text-xs font-black text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase flex items-center gap-2">
                 <Award className="w-4 h-4 text-orange-500" />
                 Achievement Badges
             </h3>
             <span className="text-[10px] font-black text-[#0061A4]">{earnedBadges.length} Earned</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
             {earnedBadges.length > 0 ? earnedBadges.map(badge => (
                <div key={badge.id} className="min-w-[100px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm">
                    <span className="text-3xl">{badge.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight">{badge.name}</span>
                </div>
             )) : (
                <div className="w-full py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                    <Award className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Consistency leads to<br/>productivity</span>
                </div>
             )}
          </div>
        </section>

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
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0061A4]" />
                  Mastery Heatmap
              </h3>
              <span className="text-[10px] text-gray-400 font-bold">Last 90 Days</span>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-[#E0E2EC] dark:border-[#44474E] shadow-sm">
            <div className="grid grid-cols-18 gap-1">
                {heatmapData90.map((val, i) => {
                let colorClass = 'bg-gray-100 dark:bg-gray-800';
                if (val > 10) colorClass = 'bg-[#0061A4] dark:bg-[#D1E6FF]';
                else if (val > 5) colorClass = 'bg-[#4396D7] dark:bg-[#4396D7]';
                else if (val > 0) colorClass = 'bg-[#D1E6FF] dark:bg-[#004A77]';
                
                return (
                    <div 
                    key={i} 
                    className={`aspect-square rounded-sm ${colorClass} transition-colors hover:ring-1 ring-[#0061A4]`}
                    title={`${val} reviews`}
                    />
                );
                })}
            </div>
            <div className="flex justify-between mt-3 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-[#E0E2EC] dark:border-[#44474E] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-[#535F70] dark:text-[#C0C7D5] tracking-widest uppercase flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Critical Weak Areas
            </h3>
          </div>
          <div className="space-y-6">
            {subjectPerformance.map(s => (
              <div key={s.name} className="flex flex-col gap-2">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black dark:text-white uppercase tracking-wider">{s.name}</span>
                    <span className={`text-[10px] font-black ${s.score > 70 ? 'text-green-500' : s.score > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                        {s.score < 40 ? 'CRITICAL' : s.score < 70 ? 'NEEDS FOCUS' : 'STABLE'}
                    </span>
                 </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-700 ease-out" 
                    style={{ 
                        width: `${s.score}%`, 
                        backgroundColor: s.score > 70 ? '#22C55E' : s.score > 40 ? '#F97316' : '#EF4444' 
                    }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold">
                    <span>{s.score}% Correct Rate</span>
                    <span>{100 - s.score}% Failure Drift</span>
                </div>
              </div>
            ))}
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
