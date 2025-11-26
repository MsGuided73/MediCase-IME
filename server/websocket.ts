/**
 * WebSocket Server for Real-time Chat
 * Handles real-time messaging, AI streaming responses, and connection management
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateSupabase } from './middleware/auth';
import { generateEnhancedDifferentialDiagnosis } from './anthropic-service';
import { generateOpenAIDifferentialDiagnosis } from './openai-service';
import { getStorageInstance } from './storage';
import { streamingAI } from './streaming-ai-service';
import type { SymptomEntry } from '../shared/schema';

interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  aiProvider?: 'claude' | 'openai' | 'comparison';
  timestamp: Date;
  metadata?: {
    streaming?: boolean;
    complete?: boolean;
    error?: string;
  };
}

interface ChatUser {
  userId: string;
  socketId: string;
  conversationId?: string;
  isAuthenticated: boolean;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ChatUser> = new Map();

  // Lazy-load storage to avoid initialization at import time
  private getStorage() {
    return getStorageInstance();
  }

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Authentication middleware for WebSocket
      socket.on('authenticate', async (token: string) => {
        try {
          // Use existing Supabase auth middleware logic
          const user = await this.authenticateUser(token);
          if (user) {
            this.connectedUsers.set(socket.id, {
              userId: user.id,
              socketId: socket.id,
              isAuthenticated: true
            });
            socket.emit('authenticated', { userId: user.id });
            console.log(`✅ User authenticated: ${user.id}`);
          } else {
            socket.emit('auth_error', { message: 'Authentication failed' });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Join conversation room
      socket.on('join_conversation', async (conversationId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (!user?.isAuthenticated) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        user.conversationId = conversationId;
        console.log(`👥 User ${user.userId} joined conversation ${conversationId}`);
        
        // Send conversation history
        try {
          const history = await this.getChatHistory(conversationId);
          socket.emit('conversation_history', history);
        } catch (error) {
          console.error('Error loading chat history:', error);
          socket.emit('error', { message: 'Failed to load chat history' });
        }
      });

      // Handle new chat messages
      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        aiProvider: 'claude' | 'openai' | 'comparison';
      }) => {
        const user = this.connectedUsers.get(socket.id);
        if (!user?.isAuthenticated) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          await this.handleChatMessage(user, data);
        } catch (error) {
          console.error('Error handling chat message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (conversationId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user?.isAuthenticated) {
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: user.userId,
            typing: true
          });
        }
      });

      socket.on('typing_stop', (conversationId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user?.isAuthenticated) {
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: user.userId,
            typing: false
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`👋 User ${user.userId} disconnected`);
          this.connectedUsers.delete(socket.id);
        }
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  private async authenticateUser(token: string) {
    // Implement Supabase token verification
    // This should use the same logic as authenticateSupabase middleware
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        throw new Error('Invalid token');
      }
      
      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  private async handleChatMessage(user: ChatUser, data: {
    conversationId: string;
    content: string;
    aiProvider: 'claude' | 'openai' | 'comparison';
  }) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save user message
    const userMessage: ChatMessage = {
      id: messageId,
      conversationId: data.conversationId,
      role: 'user',
      content: data.content,
      timestamp: new Date()
    };

    try {
      // Store user message in database
      await this.getStorage().saveChatMessage({
        id: userMessage.id,
        conversationId: userMessage.conversationId,
        role: userMessage.role,
        content: userMessage.content,
        aiProvider: undefined,
        timestamp: new Date(),
        metadata: {}
      });
    } catch (error) {
      console.error('Failed to store user message:', error);
    }

    // Broadcast user message to conversation room
    this.io.to(`conversation_${data.conversationId}`).emit('new_message', userMessage);

    // Show AI typing indicator
    this.io.to(`conversation_${data.conversationId}`).emit('ai_typing', {
      provider: data.aiProvider,
      typing: true
    });

    try {
      // Generate AI response with streaming
      await this.generateStreamingResponse(data.conversationId, data.content, data.aiProvider, user);
    } catch (error) {
      console.error('Error generating AI response:', error);
      this.io.to(`conversation_${data.conversationId}`).emit('ai_typing', {
        provider: data.aiProvider,
        typing: false
      });
      this.io.to(`conversation_${data.conversationId}`).emit('error', {
        message: 'Failed to generate AI response'
      });
    }
  }

  private async generateStreamingResponse(
    conversationId: string,
    userMessage: string,
    aiProvider: 'claude' | 'openai' | 'comparison',
    user: ChatUser
  ) {
    const responseId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create initial AI message
    const aiMessage: ChatMessage = {
      id: responseId,
      conversationId,
      role: 'assistant',
      content: '',
      aiProvider,
      timestamp: new Date(),
      metadata: { streaming: true, complete: false }
    };

    // Send initial message structure
    this.io.to(`conversation_${conversationId}`).emit('new_message', aiMessage);

    try {
      // Get conversation history for context
      const conversationHistory = await this.getConversationHistory(conversationId);

      // Get symptom context if available
      const symptomContext = await this.getSymptomContext(user.userId);

      // Start real-time streaming AI response
      await this.streamAIResponse(
        userMessage,
        aiProvider,
        aiMessage,
        conversationId,
        responseId,
        symptomContext,
        conversationHistory
      );

    } catch (error) {
      console.error('Streaming response error:', error);
      this.io.to(`conversation_${conversationId}`).emit('message_update', {
        messageId: responseId,
        content: 'Sorry, I encountered an error processing your request.',
        complete: true,
        error: true
      });
    }
  }

  /**
   * Stream AI response in real-time
   */
  private async streamAIResponse(
    message: string,
    provider: 'claude' | 'openai' | 'comparison',
    aiMessage: ChatMessage,
    conversationId: string,
    responseId: string,
    symptomContext?: SymptomEntry,
    conversationHistory?: Array<{role: string, content: string}>
  ): Promise<void> {
    let currentContent = '';
    let streamGenerator: AsyncGenerator<string, void, unknown>;

    // Select appropriate streaming service
    switch (provider) {
      case 'claude':
        streamGenerator = streamingAI.streamClaudeResponse(message, symptomContext, conversationHistory);
        break;
      case 'openai':
        streamGenerator = streamingAI.streamOpenAIResponse(message, symptomContext, conversationHistory);
        break;
      case 'comparison':
        streamGenerator = streamingAI.streamComparisonResponse(message, symptomContext, conversationHistory);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    try {
      // Stream response chunks
      for await (const chunk of streamGenerator) {
        currentContent += chunk;

        // Send streaming update to client
        this.io.to(`conversation_${conversationId}`).emit('message_update', {
          messageId: responseId,
          content: currentContent,
          complete: false
        });
      }

      // Mark as complete
      aiMessage.content = currentContent;
      aiMessage.metadata = { streaming: false, complete: true };

      // Send final completion event
      this.io.to(`conversation_${conversationId}`).emit('message_update', {
        messageId: responseId,
        content: currentContent,
        complete: true
      });

      // Stop typing indicator
      this.io.to(`conversation_${conversationId}`).emit('ai_typing', {
        provider: provider,
        typing: false
      });

      // Save final message to storage
      const storage = getStorageInstance();
      await storage.saveChatMessage(aiMessage);

    } catch (error) {
      console.error(`Error streaming ${provider} response:`, error);
      throw error;
    }
  }

  /**
   * Get conversation history for context
   */
  private async getConversationHistory(conversationId: string): Promise<Array<{role: string, content: string}>> {
    try {
      const storage = getStorageInstance();
      const messages = await storage.getChatMessages(conversationId);

      return messages
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Get user's recent symptom context
   */
  private async getSymptomContext(userId: string): Promise<SymptomEntry | undefined> {
    try {
      const storage = getStorageInstance();
      const symptoms = await storage.getSymptomEntries(userId);

      // Return most recent symptom entry
      return symptoms
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    } catch (error) {
      console.error('Error getting symptom context:', error);
      return undefined;
    }
  }

  private async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    // Placeholder for chat history retrieval
    // This will be implemented in Task 2 with proper database integration
    return [];
  }

  // Public method to get WebSocket server instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketManager;
