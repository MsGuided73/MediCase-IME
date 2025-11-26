/**
 * WebSocket Hook for Real-time Chat
 * Manages WebSocket connection, authentication, and message handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  type: 'user' | 'assistant' | 'system'; // For backward compatibility
  content: string;
  aiProvider?: 'claude' | 'openai' | 'comparison';
  provider?: 'claude' | 'openai' | 'comparison'; // For backward compatibility
  timestamp: Date;
  metadata?: {
    streaming?: boolean;
    complete?: boolean;
    error?: string;
    confidence?: number;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
    sources?: string[];
    responseTime?: number;
  };
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  reconnecting: boolean;
  error?: string;
}

export interface TypingStatus {
  userId?: string;
  aiProvider?: 'claude' | 'openai' | 'comparison';
  typing: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  sendMessage: (content: string, aiProvider: 'claude' | 'openai' | 'comparison') => void;
  joinConversation: (conversationId: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  clearMessages: () => void;
  reconnect: () => void;
}

export const useWebSocket = (conversationId?: string): UseWebSocketReturn => {
  const { session } = useSupabaseAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    authenticated: false,
    reconnecting: false
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const currentConversationId = useRef<string | undefined>(conversationId);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    
    const socket = io(process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: true, 
        reconnecting: false, 
        error: undefined 
      }));
      reconnectAttempts.current = 0;

      // Authenticate if we have a session
      if (session?.access_token) {
        socket.emit('authenticate', session.access_token);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: false, 
        authenticated: false 
      }));

      // Auto-reconnect with exponential backoff
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        
        setConnectionStatus(prev => ({ ...prev, reconnecting: true }));
        
        setTimeout(() => {
          reconnectAttempts.current++;
          socket.connect();
        }, delay);
      } else {
        setConnectionStatus(prev => ({ 
          ...prev, 
          error: 'Failed to reconnect after multiple attempts' 
        }));
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: false, 
        error: error.message 
      }));
    });

    // Authentication event handlers
    socket.on('authenticated', (data) => {
      console.log('🔐 WebSocket authenticated for user:', data.userId);
      setConnectionStatus(prev => ({ ...prev, authenticated: true }));

      // Join conversation if we have one
      if (currentConversationId.current) {
        socket.emit('join_conversation', currentConversationId.current);
      }
    });

    socket.on('auth_error', (error) => {
      console.error('🚫 WebSocket authentication error:', error);
      setConnectionStatus(prev => ({ 
        ...prev, 
        authenticated: false, 
        error: error.message 
      }));
    });

    // Message event handlers
    socket.on('new_message', (message: ChatMessage) => {
      console.log('📨 New message received:', message);
      const enhancedMessage = {
        ...message,
        timestamp: new Date(message.timestamp),
        type: message.role, // Set backward compatibility
        provider: message.aiProvider // Set backward compatibility
      };
      setMessages(prev => [...prev, enhancedMessage]);
    });

    socket.on('message_update', (update: {
      messageId: string;
      content: string;
      complete: boolean;
      error?: boolean;
    }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === update.messageId 
          ? { 
              ...msg, 
              content: update.content,
              metadata: {
                ...msg.metadata,
                streaming: !update.complete,
                complete: update.complete,
                error: update.error ? 'Response error' : undefined
              }
            }
          : msg
      ));
    });

    socket.on('conversation_history', (history: ChatMessage[]) => {
      console.log('📚 Conversation history loaded:', history.length, 'messages');
      setMessages(history.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })));
    });

    // Typing event handlers
    socket.on('user_typing', (data: TypingStatus) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        return data.typing ? [...filtered, data] : filtered;
      });
    });

    socket.on('ai_typing', (data: TypingStatus) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.aiProvider !== data.aiProvider);
        return data.typing ? [...filtered, data] : filtered;
      });
    });

    // Error handlers
    socket.on('error', (error) => {
      console.error('🚫 WebSocket error:', error);
      setConnectionStatus(prev => ({ ...prev, error: error.message }));
    });

  }, [session]);

  // Send message function
  const sendMessage = useCallback((content: string, aiProvider: 'claude' | 'openai' | 'comparison') => {
    if (!socketRef.current?.connected || !connectionStatus.authenticated || !currentConversationId.current) {
      console.warn('Cannot send message: not connected or authenticated');
      return;
    }

    socketRef.current.emit('send_message', {
      conversationId: currentConversationId.current,
      content,
      aiProvider
    });
  }, [connectionStatus.authenticated]);

  // Join conversation function
  const joinConversation = useCallback((conversationId: string) => {
    currentConversationId.current = conversationId;
    
    if (socketRef.current?.connected && connectionStatus.authenticated) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, [connectionStatus.authenticated]);

  // Typing functions
  const startTyping = useCallback(() => {
    if (socketRef.current?.connected && currentConversationId.current) {
      socketRef.current.emit('typing_start', currentConversationId.current);
    }
  }, []);

  const stopTyping = useCallback(() => {
    if (socketRef.current?.connected && currentConversationId.current) {
      socketRef.current.emit('typing_stop', currentConversationId.current);
    }
  }, []);

  // Clear messages function
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    reconnectAttempts.current = 0;
    initializeSocket();
  }, [initializeSocket]);

  // Initialize socket when session is available
  useEffect(() => {
    if (session) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up WebSocket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session, initializeSocket]);

  // Update conversation when prop changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId.current) {
      joinConversation(conversationId);
    }
  }, [conversationId, joinConversation]);

  return {
    socket: socketRef.current,
    connectionStatus,
    messages,
    typingUsers,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    clearMessages,
    reconnect
  };
};
