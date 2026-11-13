export const difficulties = {
  easy: { options: 2, attempts: 3, clues: 5, points: 10, hint: true },
  medium: { options: 4, attempts: 2, clues: 3, points: 20, hint: false },
  hard: { options: 6, attempts: 1, clues: 2, points: 30, hint: false },
};
export const getDifficulty = difficulty => Object.hasOwn(difficulties, difficulty) ? difficulties[difficulty] : difficulties.medium;
