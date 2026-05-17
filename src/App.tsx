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
import { seedData } from './lib/seed';

type View = 'home' | 'session' | 'stats' | 'settings' | 'add';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

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

  useEffect(() => {
    try {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      // Ignore
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen font-sans selection:bg-[#D1E6FF] ${isDarkMode ? 'dark bg-[#1B1B1F] text-[#E3E2E6]' : 'bg-[#FEFBFF] text-[#1B1B1F]'}`}>
      <div className={`max-w-md mx-auto min-h-screen flex flex-col relative shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#1B1B1F]' : 'bg-white'}`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          selectedDeckId={selectedDeckId}
          onSelectDeck={(id) => {
            setSelectedDeckId(id);
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
                onOpenMenu={() => setIsSidebarOpen(true)}
                onStartSession={(mode) => {
                  setSessionMode(mode);
                  setView('session');
                }}
                onViewStats={() => setView('stats')}
                onOpenSettings={() => setView('settings')}
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

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1"
            >
              <SettingsPage 
                isDarkMode={isDarkMode} 
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingsPage({ isDarkMode, onToggleDarkMode, onBack }: { isDarkMode: boolean, onToggleDarkMode: () => void, onBack: () => void }) {
  return (
    <div className="p-6 flex flex-col gap-8 h-full">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-[#0061A4]" />
            <span className="font-medium">Dark Mode</span>
          </div>
          <button 
            onClick={onToggleDarkMode}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[#0061A4]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 opacity-50">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Haptic Feedback</span>
          </div>
          <span className="text-xs font-bold text-gray-400">SOON</span>
        </div>
      </section>

      <div className="mt-auto p-4 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">mcq-prep v1.0.0 (OFFLINE)</p>
      </div>
    </div>
  );
}
