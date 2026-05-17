import Dexie, { type Table } from 'dexie';

export interface Deck {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: number;
}

export interface Subject {
  id: string;
  deckId: string;
  name: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
}

export interface Concept {
  id: string;
  topicId: string;
  name: string;
  description: string;
  // FSRS Metadata
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  lastReview?: number;
  nextReview?: number;
  isLeech: 0 | 1;
}

export interface Question {
  id: string;
  conceptId: string;
  text: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source?: string;
  negativeMarking: number;
  tags: string[];
  // Tracking
  solveCount: number;
  correctCount: number;
  wrongCount: number;
  lastSeen?: number;
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

export interface ReviewLog {
  id?: number;
  conceptId: string;
  rating: number;
  responseTime: number;
  scheduledDays: number;
  elapsedDays: number;
  stability: number;
  difficulty: number;
  reviewTime: number;
}

export class McqDatabase extends Dexie {
  decks!: Table<Deck>;
  subjects!: Table<Subject>;
  topics!: Table<Topic>;
  concepts!: Table<Concept>;
  questions!: Table<Question>;
  options!: Table<Option>;
  reviewLogs!: Table<ReviewLog>;

  constructor() {
    super('McqPrepDB');
    this.version(4).stores({
      decks: 'id, name',
      subjects: 'id, deckId',
      topics: 'id, subjectId',
      concepts: 'id, topicId, nextReview, isLeech, stability',
      questions: 'id, conceptId, wrongCount',
      options: 'id, questionId',
      reviewLogs: '++id, conceptId, reviewTime'
    });
  }
}

export const db = new McqDatabase();
