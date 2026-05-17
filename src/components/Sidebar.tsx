import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book, Hash, Clock } from 'lucide-react';
import { db, type Deck } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeck: (id: string | null) => void;
  selectedDeckId: string | null;
}

export default function Sidebar({ isOpen, onClose, onSelectDeck, selectedDeckId }: SidebarProps) {
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
              <h2 className="text-xl font-bold dark:text-white">Decks</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                onClick={() => onSelectDeck(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  selectedDeckId === null
                    ? 'bg-[#D1E6FF] text-[#001E2F] font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                <span>All Master Deck</span>
              </button>

              <div className="pt-4 pb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                My Subjects
              </div>

              {decks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => onSelectDeck(deck.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    selectedDeckId === deck.id
                      ? 'bg-[#D1E6FF] text-[#001E2F] font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Book className="w-5 h-5" />
                    <span>{deck.name}</span>
                  </div>
                </button>
              ))}
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

function LayoutGrid(props: any) {
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
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
