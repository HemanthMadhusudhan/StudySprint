
export enum QuestionType {
  MCQ = 'MCQ',
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  ESSAY = 'ESSAY'
}

export interface Question {
  id: string;
  type: QuestionType;
  marks: number;
  question: string;
  options?: string[]; // For MCQs
  answer: string; // The model answer
  explanation?: string;
}

export interface StudySession {
  summary: string;
  questions: Question[];
  keyTerms: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AppState {
  currentFile: File | null;
  extractedText: string;
  isProcessing: boolean;
  processingStatus: string; // "Uploading", "Extracting", "Analyzing"
  processingProgress: number; // 0 to 100
  error: string | null;
  studySession: StudySession | null;
  chatHistory: ChatMessage[];
  view: 'home' | 'dashboard' | 'pdf-tools';
}

export type ProcessingStep = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'done';
