import { ReviewLog } from './db';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'MASTERY' | 'CONSISTENCY' | 'ACCURACY' | 'SPEED';
}

export const BADGES: Badge[] = [
  { id: 'consistency_3', name: '3-Day Streak', description: 'Study for 3 consecutive days', icon: '🔥', category: 'CONSISTENCY' },
  { id: 'consistency_7', name: 'Weekly Warrior', description: 'Study for 7 consecutive days', icon: '💎', category: 'CONSISTENCY' },
  { id: 'mastery_10', name: 'Scholar', description: 'Master 10 concepts completely', icon: '📜', category: 'MASTERY' },
  { id: 'accuracy_perfect', name: 'Deadshot', description: 'Complete a session with 100% accuracy', icon: '🎯', category: 'ACCURACY' },
  { id: 'revision_king', name: 'Eternal Mind', description: 'Complete 50 revision items', icon: '🧠', category: 'MASTERY' },
];

export function calculateStreak(logs: ReviewLog[]): number {
  if (!logs.length) return 0;
  
  const days = new Set<string>();
  logs.forEach(log => {
    days.add(new Date(log.reviewTime).toDateString());
  });
  
  const sortedDays = Array.from(days).map(d => new Date(d).getTime()).sort((a, b) => b - a);
  
  let streak = 0;
  let current = new Date().toDateString();
  let currentTime = new Date(current).getTime();
  
  // If no activity today, check if streak ended yesterday
  const lastActivity = sortedDays[0];
  const dayInMs = 24 * 60 * 60 * 1000;
  
  if (currentTime - lastActivity > dayInMs) return 0;
  
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      streak = 1;
      continue;
    }
    
    if (sortedDays[i-1] - sortedDays[i] === dayInMs) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getEarnedBadges(logs: ReviewLog[], conceptsCount: number): Badge[] {
  const earned: Badge[] = [];
  const streak = calculateStreak(logs);
  
  if (streak >= 3) earned.push(BADGES.find(b => b.id === 'consistency_3')!);
  if (streak >= 7) earned.push(BADGES.find(b => b.id === 'consistency_7')!);
  
  // Mastery logic (placeholder for concepts with stability > X)
  // Accuracy logic (placeholder based on log success)
  
  return earned;
}
