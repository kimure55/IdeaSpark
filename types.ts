export interface Idea {
  id: string;
  phrase: string;
  category: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface GenerationConfig {
  thinkingMode: boolean;
}
