import React from 'react';
import { ChevronLeft, Moon, Sun, Monitor, Type, Layout, Activity, Eye, Zap, Shield, RotateCcw, Save, Smartphone, Volume2, Database, Info, TrendingUp, Palette, Calendar, Clock, Bell, BookOpen, Layers } from 'lucide-react';
import { Settings, FontFamily, ThemeMode, ReadingDensity, AnimationStyle, ColorMode, Orientation, Schedule } from '../lib/settings';
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
      <header className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1B1B1F] z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {/* Appearance & UI */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Layout className="w-3 h-3" />
            01. Appearance & Typography
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
                        : 'border-transparent bg-white dark:bg-gray-800'
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

        {/* Study Protocol */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Shield className="w-3 h-3" />
            02. Study Protocol & Logic
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Motion & Animations</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['FULL', 'REDUCED', 'DISABLED'] as AnimationStyle[]).map((a) => (
                    <button
                        key={a}
                        onClick={() => update({ animationStyle: a })}
                        className={`p-2 rounded-xl text-[10px] font-black border-2 transition-all active:scale-95 ${
                        settings.animationStyle === a 
                            ? 'border-[#0061A4] bg-blue-50 text-[#0061A4] dark:bg-blue-900/40' 
                            : 'border-transparent bg-white dark:bg-gray-800'
                        }`}
                    >
                        {a}
                    </button>
                    ))}
                </div>
            </div>

            <SettingToggle 
              label="Mandatory Confirmation" 
              description="Users must tap 'Confirm' before submitting"
              checked={settings.confirmBeforeSubmit}
              onChange={(v) => update({ confirmBeforeSubmit: v })}
              icon={<Shield className="w-4 h-4 text-blue-500" />}
            />
            <SettingToggle 
              label="Strict Exam Mode" 
              description="Advanced backgrounding detection & UI lockout"
              checked={settings.strictExamMode}
              onChange={(v) => update({ strictExamMode: v })}
              icon={<Activity className="w-4 h-4 text-red-500" />}
            />
            <SettingToggle 
              label="Confidence Rating" 
              description="Enable post-answer mastery feedback"
              checked={settings.confidenceRatingEnabled}
              onChange={(v) => update({ confidenceRatingEnabled: v })}
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            />
            <SettingToggle 
              label="Focus Mode Integration" 
              description="Automatically block distractions during sessions"
              checked={settings.focusModeEnabled}
              onChange={(v) => update({ focusModeEnabled: v })}
              icon={<Bell className="w-4 h-4 text-orange-500" />}
            />
          </div>
        </section>

        {/* Pre-Exam Configuration */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <TrendingUp className="w-3 h-3" />
            03. Pre-Exam Configuration
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Exam Date</label>
                <input 
                    type="date" 
                    value={settings.examDate || ''}
                    onChange={(e) => update({ examDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-black p-4 rounded-xl font-bold border border-gray-100 dark:border-gray-800 focus:outline-[#0061A4]"
                />
             </div>
             <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] font-black text-[#0061A4] dark:text-blue-300 uppercase mb-2">Adaptive Protocol Impact</p>
                <ul className="space-y-2">
                    <li className="text-[9px] text-gray-500 font-bold flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#0061A4] rounded-full" />
                        Increased revision frequency 14 days prior
                    </li>
                    <li className="text-[9px] text-gray-500 font-bold flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#0061A4] rounded-full" />
                        Priority queue for high-failure concepts
                    </li>
                </ul>
             </div>
          </div>
        </section>

        {/* Scheduling */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Calendar className="w-3 h-3" />
            04. Session Scheduling
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
                    className={`w-10 h-5 rounded-full relative transition-colors ${s.enabled ? 'bg-[#0061A4]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.enabled ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
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
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-lg px-2 py-1">
                            <Layers className="w-3 h-3 text-gray-400" />
                            <select
                                value={s.deckId || ''}
                                onChange={(e) => updateSchedule(s.id, { deckId: e.target.value || undefined })}
                                className="bg-transparent text-[10px] font-black text-[#0061A4] focus:outline-none max-w-[80px]"
                            >
                                <option value="">Master Deck</option>
                                {decks.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-lg px-2 py-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <input 
                                type="time" 
                                value={s.time}
                                onChange={(e) => updateSchedule(s.id, { time: e.target.value })}
                                className="bg-transparent text-[10px] font-black text-[#0061A4] focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System & Data */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Smartphone className="w-3 h-3" />
            05. System & Device
          </div>
          <div className="space-y-3">
             <SettingToggle 
              label="Keep Screen Awake" 
              checked={settings.keepScreenAwake}
              onChange={(v) => update({ keepScreenAwake: v })}
              icon={<Sun className="w-4 h-4 text-orange-500" />}
            />
            <SettingToggle 
              label="Fullscreen Mode" 
              checked={settings.isFullscreen}
              onChange={(v) => update({ isFullscreen: v })}
              icon={<Monitor className="w-4 h-4 text-gray-400" />}
            />
            <SettingToggle 
              label="Dynamic Accent Colors" 
              checked={settings.dynamicAccent}
              onChange={(v) => update({ dynamicAccent: v })}
              icon={<Palette className="w-4 h-4 text-pink-500" />}
            />
          </div>
        </section>

        {/* Data Management */}
        <section>
          <div className="px-2 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Database className="w-3 h-3" />
            06. Continuity & Data
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <button className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-sm">
                    <Save className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Snapshot</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-sm">
                    <RotateCcw className="w-5 h-5 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Restore</span>
                </button>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 flex items-center justify-between cursor-pointer" onClick={() => localStorage.clear()}>
                <div className="flex items-center gap-4">
                    <RotateCcw className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Factory Reset</span>
                </div>
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
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${checked ? 'left-6.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function BookOpen(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
