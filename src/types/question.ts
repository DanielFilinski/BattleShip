export type QuestionType = 'text' | 'audio' | 'video' | 'creative';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  category: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  points: number;
  question: string;
  answer: string;
  mediaPath?: string;
}
