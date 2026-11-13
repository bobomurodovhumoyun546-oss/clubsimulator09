import { getAnswerAliases } from '../i18n/gameContent.js';
import { getDifficulty } from './difficulty.js';
export const normalizeAnswer = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[‘’ʻʼ`']/g, '').replace(/[^\p{L}0-9\s]/gu, ' ').replace(/\s+/g, ' ').trim();
export const isCorrectAnswer = (question, answer) => Boolean(normalizeAnswer(answer)) && [question.answer, ...getAnswerAliases(question)].some(alias => normalizeAnswer(alias) === normalizeAnswer(answer));
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createRound(data, difficulty = 'medium') {
  const settings = getDifficulty(difficulty);
  return shuffle(data).slice(0, 10).map(question => ({
    ...question,
    options: shuffle([question.answer, ...shuffle([...new Set(data.map(item => item.answer))].filter(answer => answer !== question.answer)).slice(0, settings.options - 1)]),
  }));
}
