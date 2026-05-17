import React, { useState } from 'react';
import { ChevronLeft, Save, Plus, X, Check } from 'lucide-react';
import { db, type Concept, type Question, type Option } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface AddQuestionProps {
  onBack: () => void;
}

export default function AddQuestion({ onBack }: AddQuestionProps) {
  const [deckName, setDeckName] = useState('');
  const [conceptName, setConceptName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const decks = useLiveQuery(() => db.decks.toArray()) || [];
  const concepts = useLiveQuery(() => db.concepts.toArray()) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName || !conceptName || !questionText || options.some(o => !o.text)) {
      alert('Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Find or create deck/subject/topic
      let deck = decks.find(d => d.name.toLowerCase() === deckName.toLowerCase());
      if (!deck) {
        const deckId = self.crypto.randomUUID();
        await db.decks.put({
          id: deckId,
          name: deckName,
          description: '',
          version: '1.0',
          createdAt: Date.now()
        });
        deck = { id: deckId, name: deckName } as any;
      }

      const subjectId = `${deck!.id}-subject`;
      const topicId = `${deck!.id}-topic`;
      
      const existingSubject = await db.subjects.get(subjectId);
      if (!existingSubject) {
        await db.subjects.put({ id: subjectId, deckId: deck!.id, name: 'General' });
        await db.topics.put({ id: topicId, subjectId, name: 'Uncategorized' });
      }

      // 2. Find or create concept
      let concept = concepts.find(c => c.name.toLowerCase() === conceptName.toLowerCase());
      
      if (!concept) {
        const conceptId = self.crypto.randomUUID();
        concept = {
          id: conceptId,
          topicId,
          name: conceptName,
          description: '',
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          state: 0,
          isLeech: 0,
          nextReview: Date.now()
        };
        await db.concepts.put(concept);
      }

      // 3. Create Question
      const questionId = self.crypto.randomUUID();
      await db.questions.put({
        id: questionId,
        conceptId: concept.id,
        text: questionText,
        explanation,
        difficulty: 'Medium',
        negativeMarking: 0.25,
        tags: [],
        solveCount: 0,
        correctCount: 0,
        wrongCount: 0
      });

      // 4. Create Options
      const optionsToInsert = options.map((opt, idx) => ({
        id: self.crypto.randomUUID(),
        questionId,
        text: opt.text,
        isCorrect: opt.isCorrect
      }));
      await db.options.bulkPut(optionsToInsert);

      alert('Question added successfully!');
      // Reset form (except deck)
      setQuestionText('');
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setExplanation('');
    } catch (err) {
      console.error(err);
      alert('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const setCorrectOption = (index: number) => {
    setOptions(options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    })));
  };

  return (
    <div className="flex flex-col h-full bg-[#FEFBFF] dark:bg-[#1B1B1F]">
      <header className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold dark:text-white">Add New Question</h2>
      </header>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Deck selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-wider">
            Deck (Subject)
          </label>
          <input 
            type="text" 
            list="decks-list"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g., Cardiology, Physics"
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-[#E0E2EC] dark:border-[#44474E] rounded-2xl focus:ring-2 focus:ring-[var(--m3-primary)] outline-none dark:text-white"
          />
          <datalist id="decks-list">
            {decks.map(d => <option key={d.id} value={d.name} />)}
          </datalist>
        </div>

        {/* Concept / Topic */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-wider">
            Concept
          </label>
          <input 
            type="text" 
            list="concepts-list"
            value={conceptName}
            onChange={(e) => setConceptName(e.target.value)}
            placeholder="e.g., Valve dynamics"
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-[#E0E2EC] dark:border-[#44474E] rounded-2xl focus:ring-2 focus:ring-[#0061A4] outline-none dark:text-white"
          />
          <datalist id="concepts-list">
            {concepts.map(c => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-wider">
            Question
          </label>
          <textarea 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-[#E0E2EC] dark:border-[#44474E] rounded-2xl h-32 resize-none focus:ring-2 focus:ring-[#0061A4] outline-none dark:text-white"
          />
        </div>

        {/* Options */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-wider">
            Options (Mark the correct one)
          </label>
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <button 
                  type="button"
                  onClick={() => setCorrectOption(idx)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    opt.isCorrect 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border-2 border-green-500' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-2 border-transparent'
                  }`}
                >
                  {opt.isCorrect ? <Check className="w-6 h-6" /> : <span className="font-bold">{String.fromCharCode(65 + idx)}</span>}
                </button>
                <input 
                  type="text" 
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx].text = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 border border-[#E0E2EC] dark:border-[#44474E] rounded-2xl focus:ring-2 focus:ring-[#0061A4] outline-none dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#535F70] dark:text-[#C0C7D5] uppercase tracking-wider">
            Explanation (Optional)
          </label>
          <textarea 
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain the correct answer..."
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-[#E0E2EC] dark:border-[#44474E] rounded-2xl h-24 resize-none focus:ring-2 focus:ring-[#0061A4] outline-none dark:text-white"
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#0061A4] dark:bg-[#D1E6FF] text-white dark:text-[#003258] py-5 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? 'SAVING...' : (
              <>
                <Save className="w-5 h-5" />
                SAVE QUESTION
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
