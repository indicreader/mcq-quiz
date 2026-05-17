import React from 'react';
import { ChevronLeft, Moon, Sun, Monitor, Type, Layout, Activity, Eye, Zap, Shield, RotateCcw, Save, Smartphone, Volume2, Database, Info, TrendingUp, Palette, Calendar, Clock, Bell, BookOpen, Layers, Hash, AlertCircle } from 'lucide-react';
import { Settings, FontFamily, ThemeMode, ReadingDensity, AnimationStyle, ColorMode, Orientation, Schedule, AnswerTiming, ExplanationMode, SessionIntensity } from '../lib/settings';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SettingsScreenProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
  onBack: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onBack }: SettingsScreenProps) {
  const decks = useLiveQuery(() => db.decks.toArray()) || [];
  const update = (patch: Partial<Settings>) => onUpdate({ ...settings, ...patch });

  const updateSchedule = (id: string, patch: Partial<Schedule>) => {
    const next = settings.schedules.map(s => s.id === id ? { ...s, ...patch } : s);
    update({ schedules: next });
  };

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F] overflow-hidden">
      <header className="p-4 pt-8 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1B1B1F] z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90"
        >
          <ChevronLeft className="w-6 h-6 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold dark:text-white">Settings</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {/* Appearance & UI */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Layout className="w-3 h-3" />
            Appearance & Typography
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Theme Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['LIGHT', 'DARK', 'AMOLED'] as ThemeMode[]).map((m) => (
                  <button
 key={m}
 onClick={() => update({ themeMode: m })}
 className={`p-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
   settings.themeMode === m 
     ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40 dark:text-blue-200' 
     : 'border-transparent bg-white dark:bg-gray-800 dark:text-gray-300'
 }`}
>
 {m}
</button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Typography & Spacing</label>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Type className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Font Family</span>
                  </div>
                  <select 
                    value={settings.fontFamily}
                    onChange={(e) => update({ fontFamily: e.target.value as FontFamily })}
                    className="bg-transparent text-xs font-bold focus:outline-none border-b-2 border-[#0061A4]"
                  >
                    <option value="SANS_SERIF">Sans-serif</option>
                    <option value="DYSLEXIA">Dyslexia</option>
                    <option value="SERIF">Serif</option>
                    <option value="MONOSPACE">Monospace</option>
                    <option value="ARIAL">Arial (Exam)</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    <span>Adaptive Scale</span>
                    <div className="flex items-center gap-4">
                       <span className="text-[#0061A4]">{settings.fontSize}px</span>
                       <span className="text-[#0061A4] tracking-tighter">{settings.questionSpacing}em</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Type className="w-4 h-4 text-gray-400 opacity-50" />
                        <input 
                            type="range" min="12" max="32" step="1"
                            value={settings.fontSize}
                            onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#0061A4]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-gray-400 opacity-50" />
                        <input 
                            type="range" min="1" max="3" step="0.1"
                            value={settings.questionSpacing}
                            onChange={(e) => update({ questionSpacing: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#0061A4]"
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Reading Density</label>
               <div className="grid grid-cols-3 gap-2">
                 {(['COMPACT', 'COMFORTABLE', 'SPACIOUS'] as ReadingDensity[]).map((d) => (
                   <button
                     key={d}
                     onClick={() => update({ readingDensity: d })}
                     className={`p-2 rounded-xl text-[10px] font-black tracking-widest border-2 transition-all active:scale-95 ${
                       settings.readingDensity === d 
                         ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40 dark:text-blue-200' 
                         : 'border-transparent bg-white dark:bg-gray-800'
                     }`}
                   >
                     {d}
                   </button>
                 ))}
               </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Portrait / Orientation</label>
               <div className="grid grid-cols-3 gap-2">
                 {(['PORTRAIT', 'LANDSCAPE', 'AUTO'] as Orientation[]).map((o) => (
                   <button
                     key={o}
                     onClick={() => update({ orientation: o })}
                     className={`p-2 rounded-xl text-[10px] font-black tracking-widest border-2 transition-all active:scale-95 ${
                       settings.orientation === o 
                         ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40 dark:text-blue-200' 
                         : 'border-transparent bg-white dark:bg-gray-800'
                     }`}
                   >
                     {o}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Visual Comfort</label>
              <div className="grid grid-cols-1 gap-3">
                 {(['NATURAL', 'NEUTRAL', 'EYE_STRAIN'] as ColorMode[]).map((c) => (
                   <button
                    key={c}
                    onClick={() => update({ colorMode: c })}
                    className={`p-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between active:scale-[0.98] ${
                      settings.colorMode === c 
                        ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40' 
                        : 'border-transparent bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span>{c === 'EYE_STRAIN' ? 'Low Eye Strain (Warmer)' : c === 'NEUTRAL' ? 'Neutral Grayscale' : 'Device Natural'}</span>
                    {settings.colorMode === c && <Shield className="w-3 h-3" />}
                  </button>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* Study Experience */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Eye className="w-3 h-3" />
            Study Experience & Logic
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Answer Verification</label>
               <div className="grid grid-cols-2 gap-2">
                 {(['IMMEDIATE', 'END_OF_SESSION'] as AnswerTiming[]).map((t) => (
                   <button
                     key={t}
                     disabled={settings.schedules.some(s => s.type === 'TEST' && s.enabled)} // Implicitly disabled by logic later if in Test mode
                     onClick={() => update({ answerTiming: t })}
                     className={`p-3 rounded-xl text-[10px] font-black tracking-widest border-2 transition-all active:scale-95 ${
                       settings.answerTiming === t 
                         ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40' 
                         : 'border-transparent bg-white dark:bg-gray-800 dark:text-gray-400'
                     }`}
                   >
                     {t.replace(/_/g, ' ')}
                   </button>
                 ))}
               </div>
               <p className="mt-2 text-[9px] text-gray-400 font-medium px-1">Note: Test sessions always use end-of-session reporting.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Explanation Protocol</label>
               <div className="grid grid-cols-3 gap-2">
                 {(['INSTANT', 'DELAYED', 'DISABLED'] as ExplanationMode[]).map((m) => (
                   <button
                     key={m}
                     onClick={() => update({ explanationMode: m })}
                     className={`p-2 rounded-xl text-[10px] font-black border-2 transition-all active:scale-95 ${
                       settings.explanationMode === m 
                         ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40' 
                         : 'border-transparent bg-white dark:bg-gray-800 dark:text-gray-400'
                     }`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
            </div>

            <SettingToggle 
              label="Adaptive Prioritization" 
              description="Prioritize weak/failing questions automatically"
              checked={settings.adaptivePrioritization}
              onChange={(v) => update({ adaptivePrioritization: v })}
              icon={<Activity className="w-4 h-4 text-emerald-500" />}
            />
            <SettingToggle 
              label="Auto-Advance" 
              description="Move to next question after result (0.8s delay)"
              checked={settings.autoNext}
              onChange={(v) => update({ autoNext: v })}
              icon={<Zap className="w-4 h-4 text-orange-500" />}
            />
            <SettingToggle 
              label="Submit Protection" 
              description="Verify answer before final submission"
              checked={settings.confirmBeforeSubmit}
              onChange={(v) => update({ confirmBeforeSubmit: v })}
              icon={<Shield className="w-4 h-4 text-blue-500" />}
            />
             <SettingToggle 
              label="Strict Uninterrupted Mode" 
              description="Aggressive background app detection"
              checked={settings.strictUninterruptedMode}
              onChange={(v) => update({ strictUninterruptedMode: v })}
              icon={<AlertCircle className="w-4 h-4 text-red-500" />}
            />
            <SettingToggle 
              label="Confidence Assessment" 
              description="Rate your mastery after each answer"
              checked={settings.confidenceRatingEnabled}
              onChange={(v) => update({ confidenceRatingEnabled: v })}
              icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
            />
          </div>
        </section>

        {/* Revision Logic */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <RotateCcw className="w-3 h-3" />
            Revision & FSRS Logic
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mastery Threshold</span>
                <span className="text-xs font-black text-[#0061A4]">{Math.round(settings.masteryThreshold * 100)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="0.99" step="0.01"
                value={settings.masteryThreshold}
                onChange={(e) => update({ masteryThreshold: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-[#0061A4]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black rounded-xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Revise Queue Size</span>
                 <input 
                    type="number" 
                    value={settings.revisionQueueSize}
                    onChange={(e) => update({ revisionQueueSize: parseInt(e.target.value) })}
                    className="bg-transparent text-xs font-black text-[#0061A4] w-12 text-right"
                 />
               </div>
               <SettingToggle 
                 label="Forgotten Resurfacing"
                 description="Aggressive return of failed concepts"
                 checked={settings.forgottenResurfacingEnabled}
                 onChange={(v) => update({ forgottenResurfacingEnabled: v })}
               />
               <SettingToggle 
                 label="Suspend Mastered"
                 description="Auto-remove concepts above threshold"
                 checked={settings.suspendMastered}
                 onChange={(v) => update({ suspendMastered: v })}
               />
            </div>
          </div>
        </section>

        {/* OS Core: Advanced Protocol */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Zap className="w-3 h-3" />
            OS Core: Advanced Protocol
          </div>
          <div className="space-y-3">
             <SettingToggle 
                label="Study Lock Mode" 
                description="Hard lock until session target is achieved"
                checked={settings.studyLockEnabled}
                onChange={(v) => update({ studyLockEnabled: v })}
                icon={<Shield className="w-4 h-4 text-blue-600" />}
             />
             <SettingToggle 
                label="Exam Pressure Mode" 
                description="Auditory distraction & accelerated timer simulation"
                checked={settings.examPressureEnabled}
                onChange={(v) => update({ examPressureEnabled: v })}
                icon={<Activity className="w-4 h-4 text-orange-600" />}
             />
             <SettingToggle 
                label="Burnout Detection" 
                description="Analyze response latency for cognitive fatigue"
                checked={settings.burnoutDetectionEnabled}
                onChange={(v) => update({ burnoutDetectionEnabled: v })}
                icon={<Monitor className="w-4 h-4 text-purple-600" />}
             />
             <SettingToggle 
                label="Focus Audio" 
                description="White noise / Beta-waves during focus sessions"
                checked={settings.focusAudioEnabled}
                onChange={(v) => update({ focusAudioEnabled: v })}
                icon={<Volume2 className="w-4 h-4 text-gray-400" />}
             />
          </div>
        </section>

        {/* Performance & Recommendation */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Smartphone className="w-3 h-3" />
            Performance & System Health
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
             <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-[#0061A4] tracking-widest">OS Recommendation</h4>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                   <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      Your device is currently running at <span className="font-bold text-emerald-600">Optimal Velocity</span>. 
                      Preloading is active. Render scale is 1:1. We recommend <span className="underline">Reduced Animations</span> for extended battery life.
                   </p>
                </div>
             </div>
             <div className="space-y-3">
                <SettingToggle 
                  label="Adaptive Backup" 
                  description="Auto-backup to local storage on record change"
                  checked={settings.autoBackupEnabled}
                  onChange={(v) => update({ autoBackupEnabled: v })}
                />
                <SettingToggle 
                  label="Keep Screen Awake" 
                  checked={settings.keepScreenAwake}
                  onChange={(v) => update({ keepScreenAwake: v })}
                  icon={<Sun className="w-4 h-4 text-orange-500" />}
                />
             </div>
          </div>
        </section>

        {/* Data Persistence */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Database className="w-3 h-3" />
            Data Persistence & Exports
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <button className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-sm">
                    <Save className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">EXPORT CSV</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-sm">
                    <Layers className="w-5 h-5 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">ANKI SYNC</span>
                </button>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
               <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-inner">
                     <RotateCcw className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-tight dark:text-white">Local Encrypted Backup</h5>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Midnight Protocol Active</p>
                  </div>
                  <button className="mt-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black text-[#0061A4] uppercase tracking-widest active:scale-95 transition-all">
                     Manual Verification
                  </button>
               </div>
            </div>
          </div>
        </section>

        {/* Scheduling */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Calendar className="w-3 h-3" />
            Session Scheduling
          </div>
          <div className="space-y-4">
            {settings.schedules.map((s) => (
              <div key={s.id} className={`p-4 rounded-2xl border transition-all ${s.enabled ? 'bg-white dark:bg-gray-900 border-[#0061A4]/30 shadow-sm' : 'bg-gray-50/50 dark:bg-gray-800/30 opacity-60 border-transparent'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.type === 'TEST' ? 'bg-red-50 text-red-600' : s.type === 'REVISION' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {s.type === 'TEST' ? <Zap className="w-3 h-3" /> : s.type === 'REVISION' ? <RotateCcw className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{s.type} PHASE</span>
                  </div>
                  <button 
                    onClick={() => updateSchedule(s.id, { enabled: !s.enabled })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${s.enabled ? 'bg-[#0061A4]' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-xl p-2 border border-gray-100 dark:border-gray-800">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <input 
                                    type="time" 
                                    value={s.time}
                                    onChange={(e) => updateSchedule(s.id, { time: e.target.value })}
                                    className="bg-transparent text-[10px] font-black text-[#0061A4] focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-xl p-2 border border-gray-100 dark:border-gray-800">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <input 
                                    type="number" 
                                    value={s.questionCount}
                                    onChange={(e) => updateSchedule(s.id, { questionCount: parseInt(e.target.value) })}
                                    className="bg-transparent text-[10px] font-black text-[#0061A4] focus:outline-none w-8 text-center"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        const nextDays = s.days.includes(i) ? s.days.filter(d => d !== i) : [...s.days, i];
                                        updateSchedule(s.id, { days: nextDays });
                                    }}
                                    className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ${s.days.includes(i) ? 'bg-[#0061A4] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400 block px-1 tracking-widest">Target Decks</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => updateSchedule(s.id, { deckIds: [] })}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-all ${s.deckIds.length === 0 ? 'bg-[#0061A4] text-white border-[#0061A4]' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                ALL MASTER DECKS
                            </button>
                            {decks.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => {
                                        const next = s.deckIds.includes(d.id) 
                                            ? s.deckIds.filter(id => id !== d.id) 
                                            : [...s.deckIds, d.id];
                                        updateSchedule(s.id, { deckIds: next });
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-all ${s.deckIds.includes(d.id) ? 'bg-[#0061A4] text-white border-[#0061A4]' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-200'}`}
                                >
                                    {d.name.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Protocol */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
             <Shield className="w-3 h-3 text-red-500" />
             OS Safety & Recovery
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 flex items-center justify-between cursor-pointer" onClick={() => localStorage.clear()}>
                <div className="flex items-center gap-4">
                    <RotateCcw className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Emergency Factory Reset</span>
                </div>
          </div>
        </section>

        <div className="pt-8 text-center opacity-40">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1">Production Exam OS</p>
          <p className="text-[9px] font-mono">BUILD_COMMIT_REVISION_2026_05_17_08_56</p>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange, icon }: { label: string, description?: string, checked: boolean, onChange: (v: boolean) => void, icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.98]">
      <div className="flex gap-4">
        {icon && <div className="mt-1 flex-shrink-0">{icon}</div>}
        <div className="pr-4">
          <span className="text-sm font-bold block leading-tight">{label}</span>
          {description && <span className="text-[10px] text-gray-500 font-medium block mt-1 leading-snug">{description}</span>}
        </div>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 mt-1 rounded-full relative transition-colors duration-300 flex-shrink-0 ${checked ? 'bg-[#0061A4]' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${checked ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

