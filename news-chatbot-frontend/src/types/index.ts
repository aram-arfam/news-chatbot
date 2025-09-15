// Core message types
export type MessageRole = "user" | "assistant" | "system";

export interface Source {
  title: string;
  source: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  sources?: Source[];
  messageId?: string;
}

// Session types
export interface ChatSession {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
  messages: ChatMessage[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ChatResponse {
  sessionId: string;
  userMessage: string;
  botResponse: string;
  sources: Source[];
  messageCount: number;
  timestamp: string;
}

// Component prop types
export interface ChatInterfaceProps {
  sessionId: string;
  onResetSession: () => Promise<void>;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export interface TypingIndicatorProps {
  className?: string;
}

// Hook types
export interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  clearError: () => void;
}

export interface UseSessionReturn {
  sessionId: string | null;
  createSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  loadHistory: () => Promise<void>;
  isConnected: boolean;
}
