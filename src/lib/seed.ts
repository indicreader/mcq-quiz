import { db } from './db';

function generateQuestions(prefix: string, count: number): any[] {
  return Array.from({ length: count }).map((_, i) => ({
    question: `${prefix} Question ${i + 1}`,
    explanation: `Detailed explanation for ${prefix} question ${i + 1}.`,
    options: [`Option A`, `Option B`, `Option C`, `Option D`],
    correctOptionIndex: 0
  }));
}

export async function seedData() {
  await db.decks.clear();
  await db.subjects.clear();
  await db.topics.clear();
  await db.concepts.clear();
  await db.questions.clear();
  await db.options.clear();
  await db.reviewLogs.clear();

  const deckId = 'test-deck';
  await db.decks.put({
    id: deckId,
    name: 'Full Test Deck',
    description: '30 questions each of History, Polity, Reasoning, English',
    version: '1.0',
    createdAt: Date.now()
  });

  const subjectsData = [
    { id: 'history-sub', name: 'History' },
    { id: 'polity-sub', name: 'Polity' },
    { id: 'reasoning-sub', name: 'Reasoning' },
    { id: 'english-sub', name: 'English' }
  ];

  for (const sub of subjectsData) {
    await db.subjects.put({ id: sub.id, deckId, name: sub.name });
    const topicId = `${sub.id}-topic`;
    await db.topics.put({ id: topicId, subjectId: sub.id, name: `${sub.name} Topic` });
    
    const items = generateQuestions(sub.name, 30);
    const concepts = [];
    const questions = [];
    const options = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const conceptId = `${topicId}-concept-${i}`;
        const questionId = `${topicId}-q-${i}`;

        concepts.push({
            id: conceptId,
            topicId,
            name: `${sub.name} Concept ${i + 1}`,
            description: item.explanation,
            stability: 0,
            difficulty: 0,
            elapsedDays: 0,
            scheduledDays: 0,
            reps: 0,
            lapses: 0,
            state: 0,
            isLeech: 0 as 0 | 1,
            nextReview: Date.now() - 1000 // Just make them all due right now
        });

        questions.push({
            id: questionId,
            conceptId: conceptId,
            text: item.question,
            explanation: item.explanation,
            difficulty: 'Medium' as const,
            negativeMarking: 0.25,
            tags: [sub.name],
            solveCount: 0,
            correctCount: 0,
            wrongCount: 0
        });

        for (let j = 0; j < item.options.length; j++) {
            options.push({
                id: `${questionId}-o${j}`,
                questionId: questionId,
                text: item.options[j],
                isCorrect: j === item.correctOptionIndex
            });
        }
    }
    await db.concepts.bulkPut(concepts);
    await db.questions.bulkPut(questions);
    await db.options.bulkPut(options);
  }
}

function uuid() {
    return self.crypto.randomUUID();
}
