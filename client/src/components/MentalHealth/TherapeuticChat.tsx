import { useState, useRef, useEffect } from 'react';
import { Send, Heart, Smile, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mood?: 'supportive' | 'encouraging' | 'gentle' | 'energizing';
  techniques?: string[];
  personalizedTip?: string;
  riskAssessment?: 'low' | 'medium' | 'high';
}

interface TherapeuticResponse {
  response: string;
  techniques?: string[];
  riskAssessment?: 'low' | 'medium' | 'high';
  mood?: 'supportive' | 'encouraging' | 'gentle' | 'energizing';
  personalizedTip?: string;
  followUpSuggestions?: string[];
}

export const TherapeuticChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! I'm Alex, your wellness coach. I'm here to chat about whatever's on your mind - stress, feelings, life stuff, you name it. What's going on with you today? 😊",
      timestamp: new Date(),
      mood: 'encouraging'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      return apiRequest<TherapeuticResponse>('/api/mental-health/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationHistory
        })
      });
    },
    onSuccess: (response, userMessage) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        mood: response.mood,
        techniques: response.techniques,
        personalizedTip: response.personalizedTip,
        riskAssessment: response.riskAssessment
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Connection hiccup",
        description: "I'm having a little trouble connecting, but I'm still here for you! Try again in a moment.",
        variant: "default"
      });
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const message = input.trim();
    setInput('');
    chatMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'encouraging': return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case 'supportive': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'gentle': return <Smile className="h-4 w-4 text-blue-500" />;
      case 'energizing': return <MessageCircle className="h-4 w-4 text-green-500" />;
      default: return <Heart className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'encouraging': return 'bg-yellow-50 border-yellow-200';
      case 'supportive': return 'bg-pink-50 border-pink-200';
      case 'gentle': return 'bg-blue-50 border-blue-200';
      case 'energizing': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Stress & Well-Being Coach
          <Badge variant="secondary" className="ml-auto">
            Alex
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : `${getMoodColor(message.mood)} border`
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && getMoodIcon(message.mood)}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {message.personalizedTip && (
                        <div className="mt-2 p-2 bg-white/50 rounded border-l-2 border-blue-300">
                          <p className="text-xs font-medium text-blue-700">💡 Personal insight:</p>
                          <p className="text-xs text-blue-600">{message.personalizedTip}</p>
                        </div>
                      )}

                      {message.techniques && message.techniques.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-600">Quick techniques to try:</p>
                          {message.techniques.map((technique, index) => (
                            <div key={index} className="text-xs bg-white/70 rounded px-2 py-1 border">
                              {technique}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">Alex is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This is a supportive space. Alex is here to listen and help you feel better. 💙
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TherapeuticChat;
