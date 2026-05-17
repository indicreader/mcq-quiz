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
  deckId?: string;
}

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
  
  confirmBeforeSubmit: boolean;
  showAnswerImmediately: boolean;
  autoNext: boolean;
  confidenceRatingEnabled: boolean;
  strictExamMode: boolean;
  focusModeEnabled: boolean;
  examDate?: string;
  
  isFullscreen: boolean;
  keepScreenAwake: boolean;
  
  masteryThreshold: number;
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
  
  confirmBeforeSubmit: true,
  showAnswerImmediately: true,
  autoNext: false,
  confidenceRatingEnabled: true,
  strictExamMode: true,
  focusModeEnabled: true,
  
  isFullscreen: false,
  keepScreenAwake: true,
  
  masteryThreshold: 0.85,
  schedules: [
    { id: '1', type: 'TEST', days: [0], time: '10:00', enabled: true },
    { id: '2', type: 'REVISION', days: [0, 1, 2, 3, 4, 5, 6], time: '21:00', enabled: true },
    { id: '3', type: 'PRACTICE', days: [1, 3, 5], time: '09:00', enabled: true },
  ]
};

export function getSettings(): Settings {
  try {
    const saved = localStorage.getItem('app_settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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
