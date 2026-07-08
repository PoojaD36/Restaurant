'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatMessage } from '../lib/chat-types';
import { customerNotificationSocket } from '../lib/customer-notifications-socket';
import { useCustomerAuth } from './customer-auth-context';

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  isTyping: boolean;
  clearHistory: () => Promise<void>;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_SESSION_KEY = 'chat_session_id';
const CHAT_MESSAGES_KEY = 'chat_messages';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { isAuthenticated } = useCustomerAuth();

  // Load session and messages from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem(CHAT_SESSION_KEY);
    const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);

    if (savedSessionId) {
      setSessionId(savedSessionId);
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to parse saved chat messages:', e);
      }
    }
  }, []);

  // Set up WebSocket listeners for chat
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleResponse = (data: { sessionId: string; response: string; timestamp: string }) => {
      setIsLoading(false);
      setIsTyping(false);

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
      };

      setMessages(prev => {
        const updated = [...prev, newMessage];
        // Save to localStorage
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(updated));
        return updated;
      });

      // Update session ID
      if (data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(CHAT_SESSION_KEY, data.sessionId);
      }
    };

    const handleTyping = (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    };

    const handleError = (data: { error: string }) => {
      setIsLoading(false);
      setIsTyping(false);
      setError(data.error);
      setTimeout(() => setError(null), 5000);
    };

    customerNotificationSocket.onChatResponse(handleResponse);
    customerNotificationSocket.onChatTyping(handleTyping);
    customerNotificationSocket.onChatError(handleError);

    return () => {
      customerNotificationSocket.offChatResponse(handleResponse);
      customerNotificationSocket.offChatTyping(handleTyping);
      customerNotificationSocket.offChatError(handleError);
    };
  }, [isAuthenticated, sessionId]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      // Save to localStorage
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(updated));
      return updated;
    });

    setIsLoading(true);

    // Send via WebSocket
    try {
      customerNotificationSocket.sendChatMessage(sessionId || undefined, message);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setTimeout(() => setError(null), 5000);
    }
  }, [isLoading, sessionId]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(CHAT_SESSION_KEY);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    setError(null);
  }, []);

  const value: ChatContextType = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    messages,
    sendMessage,
    isLoading,
    isTyping,
    clearHistory,
    error,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
