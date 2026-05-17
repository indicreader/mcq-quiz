import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  BarChart2, 
  Settings, 
  Plus, 
  Play, 
  ChevronLeft, 
  Timer,
  CheckCircle2,
  AlertCircle,
  Hash,
  Flame,
  Zap,
  LayoutGrid,
  PlusCircle,
  Menu,
  Book
} from 'lucide-react';
import { db, type Concept, type Question, type Option, type Deck } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import Home from './components/Home';
import Session from './components/Session';
import Stats from './components/Stats';
import AddQuestion from './components/AddQuestion';
import Sidebar from './components/Sidebar';
import SettingsScreen from './components/SettingsScreen';
import CalendarView from './components/CalendarView';
import { seedData } from './lib/seed';
import MistakeJournal from './components/MistakeJournal';
import { getSettings, saveSettings, Settings as AppSettings } from './lib/settings';

type View = 'home' | 'session' | 'stats' | 'settings' | 'add' | 'mistake_journal' | 'calendar';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <pre className="text-xs bg-white p-4 rounded border border-red-200 overflow-auto max-w-full">
            {JSON.stringify(this.state.error, (key, value) => 
              value instanceof Error ? { message: value.message, stack: value.stack } : value
            , 2)}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [view, setView] = useState<View>('home');
  const [sessionMode, setSessionMode] = useState<'practice' | 'revision' | 'exam'>('revision');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const isDarkMode = settings.themeMode === 'DARK' || settings.themeMode === 'AMOLED';
  const isAmoled = settings.themeMode === 'AMOLED';

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: any = null;
    if (settings.keepScreenAwake && 'wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('Wake Lock request failed', err);
        }
      };
      requestWakeLock();
    }
    return () => {
      if (wakeLock) wakeLock.release().then(() => { wakeLock = null; });
    };
  }, [settings.keepScreenAwake]);

  // Orientation handling
  useEffect(() => {
    if (settings.orientation !== 'AUTO' && 'orientation' in screen) {
        (screen as any).orientation?.lock?.(settings.orientation.toLowerCase()).catch(() => {
            console.warn("Manual orientation lock not supported on this browser/device");
        });
    }
  }, [settings.orientation]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const selectedDeck = useLiveQuery(
    () => selectedDeckId ? db.decks.get(selectedDeckId) : Promise.resolve(null),
    [selectedDeckId]
  );
  
  // Seed data if empty
  const decksCount = useLiveQuery(() => {
    try {
      return db.decks.count();
    } catch (e) {
      console.error('Failed to count decks:', e);
      return 0;
    }
  });

  useEffect(() => {
    if (decksCount === 0) {
      seedData().catch(err => {
        console.error('Seeding failed:', err);
      });
    }
  }, [decksCount]);

  const appContainerClass = `min-h-screen transition-all duration-300 ${
    isDarkMode ? 'dark' : ''
  } ${
    isAmoled ? 'amoled' : ''
  } color-${settings.colorMode} animation-${settings.animationStyle} ${settings.orientation === 'LANDSCAPE' ? 'landscape' : ''}`;

  const innerContainerClass = `mx-auto min-h-screen flex flex-col relative shadow-xl transition-all duration-300 ${
    isDarkMode ? (isAmoled ? 'bg-black' : 'bg-[#1B1B1F]') : 'bg-white'
  } font-family-${settings.fontFamily} density-${settings.readingDensity} ${
    settings.orientation === 'LANDSCAPE' ? 'max-w-4xl' : 'max-w-md'
  }`;

  return (
    <div className={appContainerClass} style={{ fontSize: `${settings.fontSize}px` }}>
      <div className={innerContainerClass}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          selectedDeckId={selectedDeckId}
          onSelectDeck={(id) => {
            setSelectedDeckId(id);
            setIsSidebarOpen(false);
          }}
          onSelectMode={(mode) => {
            if (mode === 'mistake_journal') {
              setView('mistake_journal');
            } else if (mode === 'stats') {
              setView('stats');
            } else if (mode === 'calendar') {
              setView('calendar');
            } else {
              setSessionMode(mode as any);
              setView('session');
            }
            setIsSidebarOpen(false);
          }}
        />
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1"
            >
              <Home 
                selectedDeck={selectedDeck || undefined}
                settings={settings}
                onOpenMenu={() => setIsSidebarOpen(true)}
                onStartSession={(mode) => {
                  setSessionMode(mode);
                  setView('session');
                }}
                onViewStats={() => setView('stats')}
                onOpenSettings={() => setView('settings')}
                onViewCalendar={() => setView('calendar')}
                onAddQuestion={() => setView('add')}
              />
            </motion.div>
          )}

          {view === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="flex-1"
            >
              <AddQuestion onBack={() => setView('home')} />
            </motion.div>
          )}

          {view === 'session' && (
            <motion.div
              key="session"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1"
            >
              <Session 
                mode={sessionMode} 
                deckId={selectedDeckId || undefined}
                onFinish={() => setView('home')}
                onBack={() => setView('home')}
                settings={settings}
              />
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1"
            >
              <Stats onBack={() => setView('home')} />
            </motion.div>
          )}
          
          {view === 'mistake_journal' && (
            <motion.div
              key="mistake_journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <MistakeJournal onBack={() => setView('home')} />
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1"
            >
              <SettingsScreen 
                settings={settings}
                onUpdate={setSettings}
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="flex-1"
            >
              <CalendarView onBack={() => setView('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Remove the old SettingsPage declaration as it's now in a separate file
