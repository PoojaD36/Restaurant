export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  startedAt: Date;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  sessionId: string;
  timestamp?: string;
}

export interface ChatErrorResponse {
  error: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  session: {
    sessionId: string;
    messages: Array<{
      role: string;
      content: string;
      createdAt: Date;
    }>;
  } | null;
}
