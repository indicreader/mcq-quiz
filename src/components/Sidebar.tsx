import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book, Hash, Clock, Zap, LayoutGrid, AlertCircle, TrendingUp, Calendar, Mail } from 'lucide-react';
import { db, type Deck } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeck: (id: string | null) => void;
  selectedDeckId: string | null;
  onSelectMode: (mode: 'practice' | 'revision' | 'exam' | 'stats' | 'mistake_journal' | 'calendar') => void;
}

export default function Sidebar({ isOpen, onClose, onSelectDeck, selectedDeckId, onSelectMode }: SidebarProps) {
  const decks = useLiveQuery(() => db.decks.toArray()) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 z-40"
          />

          {/* Sidebar Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-4/5 max-w-[300px] bg-[#FEFBFF] dark:bg-[#1B1B1F] z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Prep Menu</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <button
                onClick={() => onSelectDeck(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  selectedDeckId === null
                    ? 'bg-[var(--m3-primary-container)] text-[#001E2F] dark:bg-[#004A77] dark:text-[var(--m3-primary-container)] font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                <span>All Master Deck</span>
              </button>

              <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                My Subjects
              </div>

              {decks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => onSelectDeck(deck.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    selectedDeckId === deck.id
                      ? 'bg-[var(--m3-primary-container)] text-[#001E2F] dark:bg-[#004A77] dark:text-[var(--m3-primary-container)] font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Book className="w-5 h-5" />
                    <span className="truncate">{deck.name}</span>
                  </div>
                </button>
              ))}

              <div className="pt-6 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Analytics & Review
              </div>

              <button
                onClick={() => onSelectMode('mistake_journal' as any)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>Mistake Journal</span>
              </button>

              <button
                onClick={() => onSelectMode('stats')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Productivity Stats</span>
              </button>

              <button
                onClick={() => onSelectMode('calendar')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <Calendar className="w-5 h-5 text-[var(--m3-primary)]" />
                <span>Study Calendar</span>
              </button>

              <div className="pt-6 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Study Modes
              </div>

              <button
                onClick={() => onSelectMode('practice')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <Hash className="w-5 h-5 text-blue-500" />
                <span>Practice Mode</span>
              </button>

              <button
                onClick={() => onSelectMode('exam')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <Clock className="w-5 h-5 text-orange-500" />
                <span>Test Mode</span>
              </button>

              <button
                onClick={() => onSelectMode('revision')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Revise Mode</span>
              </button>

              <div className="pt-6 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Support
              </div>

              <button
                onClick={() => {
                  window.location.href = `mailto:support@mcqprep.com?subject=McqPrep%20Feedback&body=Version:%20v1.0.0`;
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all font-medium"
              >
                <Mail className="w-5 h-5 text-gray-500" />
                <span>Contact Support</span>
              </button>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-500">
              v1.0.0 Alpha
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

