export type FontFamily = 'SANS_SERIF' | 'DYSLEXIA' | 'SERIF' | 'MONOSPACE' | 'ARIAL';
export type ThemeMode = 'DARK' | 'AMOLED' | 'LIGHT';
export type ReadingDensity = 'COMPACT' | 'COMFORTABLE' | 'SPACIOUS';
export type AnimationStyle = 'FULL' | 'REDUCED' | 'DISABLED';
export type ColorMode = 'NEUTRAL' | 'EYE_STRAIN' | 'NATURAL';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE' | 'AUTO';

export interface Schedule {
  id: string;
  type: 'PRACTICE' | 'TEST' | 'REVISION';
  days: number[]; // 0-6 (Sun-Sat)
  time: string; // HH:mm
  enabled: boolean;
  deckIds: string[];
  questionCount: number;
}

export type AnswerTiming = 'IMMEDIATE' | 'END_OF_SESSION';
export type ExplanationMode = 'INSTANT' | 'DELAYED' | 'DISABLED';
export type SessionIntensity = 'RELAXED' | 'STANDARD' | 'INTENSE';

export interface Settings {
  themeMode: ThemeMode;
  fontSize: number;
  fontFamily: FontFamily;
  readingDensity: ReadingDensity;
  animationStyle: AnimationStyle;
  colorMode: ColorMode;
  dynamicAccent: boolean;
  questionSpacing: number;
  orientation: Orientation;
  
  // Study Experience
  answerTiming: AnswerTiming;
  explanationMode: ExplanationMode;
  adaptivePrioritization: boolean;
  autoNext: boolean;
  confirmBeforeSubmit: boolean;
  pauseOnMinimize: boolean;
  strictUninterruptedMode: boolean;
  confidenceRatingEnabled: boolean;
  mistakeTaggingEnabled: boolean;
  sessionIntensity: SessionIntensity;
  focusAudioEnabled: boolean;
  
  // Revision Logic
  masteryThreshold: number;
  revisionQueueSize: number;
  repeatIntervalBase: number; // in days
  easyIntervalModifier: number;
  hardIntervalModifier: number;
  forgottenResurfacingEnabled: boolean;
  weakTopicPrioritization: boolean;
  suspendMastered: boolean;
  
  // Advanced Features
  studyLockEnabled: boolean;
  examPressureEnabled: boolean;
  burnoutDetectionEnabled: boolean;
  examDate?: string;
  
  // System
  isFullscreen: boolean;
  keepScreenAwake: boolean;
  autoBackupEnabled: boolean;
  lastBackupAt?: number;
  
  schedules: Schedule[];
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'DARK',
  fontSize: 16,
  fontFamily: 'SANS_SERIF',
  readingDensity: 'COMFORTABLE',
  animationStyle: 'FULL',
  colorMode: 'NATURAL',
  dynamicAccent: true,
  questionSpacing: 1.5,
  orientation: 'AUTO',
  
  answerTiming: 'IMMEDIATE',
  explanationMode: 'INSTANT',
  adaptivePrioritization: true,
  autoNext: false,
  confirmBeforeSubmit: true,
  pauseOnMinimize: true,
  strictUninterruptedMode: false,
  confidenceRatingEnabled: true,
  mistakeTaggingEnabled: true,
  sessionIntensity: 'STANDARD',
  focusAudioEnabled: false,
  
  masteryThreshold: 0.85,
  revisionQueueSize: 50,
  repeatIntervalBase: 1,
  easyIntervalModifier: 1.3,
  hardIntervalModifier: 0.8,
  forgottenResurfacingEnabled: true,
  weakTopicPrioritization: true,
  suspendMastered: true,
  
  studyLockEnabled: false,
  examPressureEnabled: false,
  burnoutDetectionEnabled: true,
  
  isFullscreen: false,
  keepScreenAwake: true,
  autoBackupEnabled: true,
  
  schedules: [
    { id: '1', type: 'TEST', days: [0], time: '10:00', enabled: true, deckIds: [], questionCount: 100 },
    { id: '2', type: 'REVISION', days: [0, 1, 2, 3, 4, 5, 6], time: '21:00', enabled: true, deckIds: [], questionCount: 50 },
    { id: '3', type: 'PRACTICE', days: [1, 3, 5], time: '09:00', enabled: true, deckIds: [], questionCount: 25 },
  ]
};

export function getSettings(): Settings {
  try {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Migration for schedules
        if (parsed.schedules) {
            parsed.schedules = parsed.schedules.map((s: any) => ({
                ...s,
                deckIds: s.deckIds || (s.deckId ? [s.deckId] : []),
                questionCount: s.questionCount || (s.type === 'TEST' ? 100 : s.type === 'REVISION' ? 50 : 25)
            }));
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}
