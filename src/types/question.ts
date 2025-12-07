export type QuestionType = 'text' | 'audio' | 'video' | 'image' | 'creative';
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
  answerImages?: string | string[]; // Single image path or array of image paths
}
