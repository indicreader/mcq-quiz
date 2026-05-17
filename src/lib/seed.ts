import { db } from './db';
export async function seedData() {
  const deckId = 'foundation-science-deck';
  await db.decks.put({
    id: deckId,
    name: 'Foundation Science',
    description: 'Core concepts for competitive exams',
    version: '1.0',
    createdAt: Date.now()
  });

  const subjects = [
    { id: 'physics-sub', deckId, name: 'Physics' },
    { id: 'chemistry-sub', deckId, name: 'Chemistry' },
    { id: 'biology-sub', deckId, name: 'Biology' }
  ];
  await db.subjects.bulkPut(subjects);

  const topics = [
    { id: 'thermo-topic', subjectId: 'physics-sub', name: 'Thermodynamics' },
    { id: 'mechanics-topic', subjectId: 'physics-sub', name: 'Mechanics' },
    { id: 'organic-topic', subjectId: 'chemistry-sub', name: 'Organic Chemistry' }
  ];
  await db.topics.bulkPut(topics);

  const concepts = [
    {
      id: 'concept-1',
      topicId: 'thermo-topic',
      name: 'First Law of Thermodynamics',
      description: 'Conservation of energy in thermal processes',
      stability: 1.2,
      difficulty: 3.5,
      elapsedDays: 1,
      scheduledDays: 1,
      reps: 1,
      lapses: 0,
      state: 2,
      isLeech: 0 as 0 | 1,
      nextReview: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: 'concept-2',
      topicId: 'thermo-topic',
      name: 'Entropy and Second Law',
      description: 'Direction of heat flow and disorder',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      isLeech: 0 as 0 | 1,
      nextReview: Date.now()
    },
    {
      id: 'concept-3',
      topicId: 'mechanics-topic',
      name: 'Newton\'s Second Law',
      description: 'F = ma',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      isLeech: 1 as 0 | 1,
      nextReview: Date.now() - 5000 // Just became due
    },
    {
      id: 'concept-4',
      topicId: 'organic-topic',
      name: 'Functional Groups',
      description: 'Standard group of atoms in organic molecules',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      isLeech: 0 as 0 | 1,
      nextReview: Date.now() - 2000
    }
  ];

  await db.concepts.bulkPut(concepts);

  const questions = [
    {
      id: 'q1',
      conceptId: 'concept-1',
      text: 'Which equation correctly represents the First Law of Thermodynamics?',
      explanation: 'ΔU = Q - W represents the change in internal energy as heat added minus work done by the system.',
      difficulty: 'Easy' as const,
      negativeMarking: 0.25,
      tags: ['Law', 'Energy']
    },
    {
      id: 'q2',
      conceptId: 'concept-2',
      text: 'According to the Second Law of Thermodynamics, in an isolated system, the total entropy:',
      explanation: 'The Second Law states that the total entropy of an isolated system can never decrease over time; it can only remain constant or increase.',
      difficulty: 'Medium' as const,
      negativeMarking: 0.25,
      tags: ['Entropy', 'Second Law']
    },
    {
      id: 'q3',
      conceptId: 'concept-3',
      text: 'A force of 10N acts on a 2kg mass. What is the acceleration?',
      explanation: 'Using F = ma, a = F/m = 10N / 2kg = 5 m/s².',
      difficulty: 'Easy' as const,
      negativeMarking: 0.25,
      tags: ['Mechanics', 'Force']
    },
    {
      id: 'q4',
      conceptId: 'concept-4',
      text: 'Which functional group is characterized by the presence of a carbonyl group bonded to at least one hydrogen atom?',
      explanation: 'An aldehyde contains a carbonyl group (-C=O) bonded to at least one hydrogen atom.',
      difficulty: 'Medium' as const,
      negativeMarking: 0.25,
      tags: ['Organic', 'Functional Groups']
    }
  ];

  await db.questions.bulkPut(questions);

  await db.options.bulkPut([
    { id: 'o1', questionId: 'q1', text: 'ΔU = Q + W', isCorrect: false },
    { id: 'o2', questionId: 'q1', text: 'ΔU = Q - W', isCorrect: true },
    { id: 'o3', questionId: 'q1', text: 'ΔU = Q / W', isCorrect: false },
    { id: 'o4', questionId: 'q1', text: 'Q = ΔU / W', isCorrect: false },
    
    { id: 'o5', questionId: 'q2', text: 'Always decreases', isCorrect: false },
    { id: 'o6', questionId: 'q2', text: 'Remains zero', isCorrect: false },
    { id: 'o7', questionId: 'q2', text: 'Can never decrease', isCorrect: true },
    { id: 'o8', questionId: 'q2', text: 'Is always constant', isCorrect: false },

    { id: 'o9', questionId: 'q3', text: '2 m/s²', isCorrect: false },
    { id: 'o10', questionId: 'q3', text: '5 m/s²', isCorrect: true },
    { id: 'o11', questionId: 'q3', text: '10 m/s²', isCorrect: false },
    { id: 'o12', questionId: 'q3', text: '20 m/s²', isCorrect: false },

    { id: 'o13', questionId: 'q4', text: 'Ketone', isCorrect: false },
    { id: 'o14', questionId: 'q4', text: 'Aldehyde', isCorrect: true },
    { id: 'o15', questionId: 'q4', text: 'Alcohol', isCorrect: false },
    { id: 'o16', questionId: 'q4', text: 'Carboxylic Acid', isCorrect: false }
  ]);
}

// Simple UUID polyfill if needed, but we can just use crypto.randomUUID
function uuid() {
    return self.crypto.randomUUID();
}
