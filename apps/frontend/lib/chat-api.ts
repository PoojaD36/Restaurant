import { ChatResponse, ChatHistoryResponse } from './chat-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get customer token from localStorage
 */
function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Send chat message to AI bot
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  const token = getCustomerToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`${API_URL}/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send chat message');
  }

  return response.json();
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  const token = getCustomerToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`${API_URL}/chatbot/history/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get chat history');
  }

  return response.json();
}

/**
 * Clear chat history for a session
 */
export async function clearChatHistory(sessionId: string): Promise<{ success: boolean; message: string }> {
  const token = getCustomerToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`${API_URL}/chatbot/history/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clear chat history');
  }

  return response.json();
}
