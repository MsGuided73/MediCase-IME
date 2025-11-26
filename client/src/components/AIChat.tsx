import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Loader2, Brain, Search, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useWebSocket, type ChatMessage } from '../hooks/useWebSocket';

// Use ChatMessage from WebSocket hook
type Message = ChatMessage;

interface ChatSession {
  id: string;
  symptomEntryId?: number;
  messages: Message[];
  title: string;
  createdAt: Date;
  aiProvider: 'claude' | 'openai' | 'comparison';
}

interface AIChatProps {
  symptomEntryId?: number;
  initialMode?: 'claude' | 'openai' | 'comparison';
  onClose?: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  symptomEntryId,
  initialMode = 'claude',
  onClose
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState<'claude' | 'openai' | 'comparison'>(initialMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Generate conversation ID based on symptom entry or create new one
  const conversationId = symptomEntryId ? `symptom_${symptomEntryId}` : `chat_${Date.now()}`;

  // Use WebSocket hook for real-time chat
  const {
    connectionStatus,
    messages,
    typingUsers,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    reconnect
  } = useWebSocket(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Join conversation when component mounts
  useEffect(() => {
    if (connectionStatus.authenticated) {
      joinConversation(conversationId);
    }
  }, [connectionStatus.authenticated, conversationId, joinConversation]);

  // Load initial symptom context if provided
  const { data: symptomResponse } = useQuery({
    queryKey: ['symptom-context', symptomEntryId],
    queryFn: async () => {
      if (!symptomEntryId) return null;
      const response = await apiRequest('GET', `/api/symptoms/${symptomEntryId}`);
      return await response.json();
    },
    enabled: !!symptomEntryId
  });

  // Handle symptom data when it changes
  useEffect(() => {
    if (symptomResponse && connectionStatus.authenticated) {
      // Send initial context message through WebSocket
      const contextContent = `I'm ready to help you understand your symptom: "${symptomResponse.symptomDescription}". You can ask me follow-up questions, request clarifications, or get a second opinion from different AI models.`;
      sendMessage(contextContent, currentMode);
    }
  }, [symptomResponse, connectionStatus.authenticated]);

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    setInput(value);

    // Start typing indicator
    if (value.trim() && connectionStatus.authenticated) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || !connectionStatus.authenticated) return;

    const messageContent = input.trim();
    setInput('');
    stopTyping();

    // Send message through WebSocket
    sendMessage(messageContent, currentMode);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    // Voice recording functionality - to be implemented with Web Speech API
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Voice Recording",
        description: "Voice input feature coming soon!"
      });
    }
  };

  const toggleSpeaking = () => {
    // Text-to-speech functionality
    setIsSpeaking(!isSpeaking);
    if (!isSpeaking) {
      toast({
        title: "Voice Output",
        description: "Voice responses coming soon!"
      });
    }
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'claude':
        return <Brain className="h-4 w-4 text-purple-600" />;
      case 'openai':
        return <Bot className="h-4 w-4 text-green-600" />;
      case 'perplexity':
        return <Search className="h-4 w-4 text-blue-600" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Medical AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* AI Provider Selector */}
            <div className="flex rounded-lg border">
              <Button
                variant={currentMode === 'claude' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('claude')}
                className="rounded-r-none"
              >
                <Brain className="h-4 w-4 mr-1" />
                Claude
              </Button>
              <Button
                variant={currentMode === 'openai' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('openai')}
                className="rounded-none border-x"
              >
                <Bot className="h-4 w-4 mr-1" />
                GPT-4o
              </Button>
              <Button
                variant={currentMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('comparison')}
                className="rounded-l-none"
              >
                Compare
              </Button>
            </div>
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentMode === 'comparison'
              ? 'Get insights from both Claude and OpenAI with Perplexity research'
              : `Powered by ${currentMode === 'claude' ? 'Claude 4.0 Sonnet' : 'GPT-4o'} with medical research`
            }
          </span>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              connectionStatus.authenticated ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Authenticating...</span>
                </div>
              )
            ) : connectionStatus.reconnecting ? (
              <div className="flex items-center gap-1 text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Reconnecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-3 w-3" />
                <span className="text-xs">Disconnected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reconnect}
                  className="h-auto p-1 text-xs"
                >
                  Retry
                </Button>
              </div>
            )}

            {connectionStatus.error && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs" title={connectionStatus.error}>Error</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation about your symptoms</p>
                <p className="text-sm mt-1">Ask questions, get clarifications, or request medical insights</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'system'
                      ? 'bg-muted text-muted-foreground text-center'
                      : 'bg-secondary'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      {getProviderIcon(message.provider)}
                      <span className="text-xs font-medium capitalize">
                        {message.provider || 'AI Assistant'}
                      </span>
                      {message.metadata?.urgency && (
                        <Badge className={`text-xs ${getUrgencyColor(message.metadata.urgency)}`}>
                          {message.metadata.urgency}
                        </Badge>
                      )}
                      {message.metadata?.responseTime && (
                        <span className="text-xs text-muted-foreground">
                          {message.metadata.responseTime}ms
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.metadata?.sources && message.metadata.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                      <div className="space-y-1">
                        {message.metadata.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="text-xs text-blue-600 hover:underline cursor-pointer">
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicators */}
            {typingUsers.map((typingUser, index) => (
              <div key={index} className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    {typingUser.aiProvider && getProviderIcon(typingUser.aiProvider)}
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {typingUser.aiProvider
                        ? `${typingUser.aiProvider === 'claude' ? 'Claude' : typingUser.aiProvider === 'openai' ? 'GPT-4o' : 'AI'} is thinking...`
                        : 'User is typing...'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleRecording}
              className={`transition-all duration-200 hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
            >
              {isRecording ? <MicOff className="h-4 w-4 transition-transform duration-200 hover:rotate-12" /> : <Mic className="h-4 w-4 transition-transform duration-200 hover:scale-110 hover:rotate-6" />}
            </Button>
            
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !connectionStatus.authenticated
                    ? "Connecting to chat..."
                    : "Ask about your symptoms, request clarification, or get medical insights..."
                }
                className="pr-10"
                disabled={!connectionStatus.authenticated}
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSpeaking}
              className={isSpeaking ? 'bg-blue-100 text-blue-600' : ''}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || !connectionStatus.authenticated}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            This is educational only—consult a licensed clinician for medical advice
          </div>
        </div>
      </CardContent>
    </Card>
  );
};