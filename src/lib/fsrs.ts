export interface SchedulingInfo {
  stability: number;
  difficulty: number;
  interval: number;
}

const w = [
  0.4, 0.6, 2.4, 5.8, // Initial stability for Again, Hard, Good, Easy
  4.9, 0.94, 0.86, 0.01, // Stability decay and growth constants
  0.91, 0.02, 0.11, // Difficulty growth constants
  1.0, 0.0, // Retrievability constants
  0.0 // Reserved
];

export function calculateNextState(
  stability: number,
  difficulty: number,
  elapsedDays: number,
  rating: number,
  state: number
): SchedulingInfo {
  if (state === 0) { // New
    return init(rating);
  } else {
    return nextStep(stability, difficulty, elapsedDays, rating);
  }
}

function init(rating: number): SchedulingInfo {
  const s = w[rating - 1];
  const d = 5.0 - (rating - 3) * 2.0;
  return {
    stability: s,
    difficulty: Math.max(1, Math.min(10, d)),
    interval: calculateInterval(s)
  };
}

function nextStep(s: number, d: number, elapsed: number, rating: number): SchedulingInfo {
  const retrievability = Math.pow(1 + elapsed / (9 * s), -1);
  
  // Update Difficulty
  let newD = d - (rating - 3) * 1.5;
  newD = Math.max(1, Math.min(10, newD));

  // Update Stability
  let newS: number;
  if (rating === 1) { // Again
    newS = 0.5 * s;
  } else {
    newS = s * (1 + Math.exp(w[8]) * (11 - newD) * Math.pow(s, -w[9]) * (Math.exp((1 - retrievability) * w[10]) - 1));
  }

  return {
    stability: newS,
    difficulty: newD,
    interval: calculateInterval(newS)
  };
}

function calculateInterval(s: number): number {
  const interval = s * 9;
  return Math.max(1, Math.round(interval));
}
