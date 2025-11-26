import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Brain, Heart, Shield, Lightbulb, Phone, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  techniques?: string[];
  resources?: string[];
  riskAssessment?: 'low' | 'medium' | 'high';
  followUpSuggestions?: string[];
}

interface TherapeuticResponse {
  response: string;
  techniques?: string[];
  resources?: string[];
  riskAssessment?: 'low' | 'medium' | 'high';
  followUpSuggestions?: string[];
}

const MentalHealthPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { session } = useSupabaseAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your mental health companion. I'm here to provide support, coping strategies, and a safe space to talk about what's on your mind. How are you feeling today?",
      timestamp: new Date(),
      techniques: ["Take a moment to breathe deeply", "Notice how you're feeling right now", "Remember that it's okay to not be okay"],
      riskAssessment: 'low'
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<TherapeuticResponse> => {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await apiRequest('POST', '/api/mental-health/chat', {
        message,
        conversationHistory
      });

      return response.json();
    },
    onSuccess: (response, message) => {
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        techniques: response.techniques,
        resources: response.resources,
        riskAssessment: response.riskAssessment,
        followUpSuggestions: response.followUpSuggestions
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please try again.",
        variant: "destructive"
      });
      console.error('Chat error:', error);
    }
  });

  const handleSendMessage = async () => {
    if (!input.trim() || sendMessageMutation.isPending) return;

    const messageContent = input.trim();
    setInput('');
    
    sendMessageMutation.mutate(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Voice Recording",
        description: "Voice input feature coming soon!"
      });
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    if (!isSpeaking) {
      toast({
        title: "Text-to-Speech",
        description: "Voice output feature coming soon!"
      });
    }
  };

  const getRiskBadgeColor = (risk?: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access mental health support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Mental Health Support</h1>
              <p className="text-sm text-gray-600">Your compassionate AI companion for mental wellness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Resources Alert */}
      <div className="max-w-4xl mx-auto px-4 py-2">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Crisis Support:</strong> If you're in immediate danger, call 911. 
            For mental health crisis support: <strong>988 Suicide & Crisis Lifeline</strong> or text <strong>HOME to 741741</strong>
          </AlertDescription>
        </Alert>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <span>Therapeutic Chat</span>
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Available 24/7
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`p-2 rounded-full ${message.role === 'user' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                          {message.role === 'user' ? (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              U
                            </div>
                          ) : (
                            <Brain className="h-6 w-6 text-pink-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          
                          {/* Assistant message extras */}
                          {message.role === 'assistant' && (
                            <div className="mt-2 space-y-2">
                              {message.riskAssessment && (
                                <Badge className={`text-xs ${getRiskBadgeColor(message.riskAssessment)}`}>
                                  Risk Level: {message.riskAssessment}
                                </Badge>
                              )}
                              
                              {message.techniques && message.techniques.length > 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Suggested Techniques</span>
                                  </div>
                                  <ul className="text-sm text-blue-700 space-y-1">
                                    {message.techniques.map((technique, index) => (
                                      <li key={index} className="flex items-start space-x-2">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>{technique}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {message.resources && message.resources.length > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Phone className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">Resources</span>
                                  </div>
                                  <ul className="text-sm text-green-700 space-y-1">
                                    {message.resources.map((resource, index) => (
                                      <li key={index} className="flex items-start space-x-2">
                                        <span className="text-green-400 mt-1">•</span>
                                        <span>{resource}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="p-2 rounded-full bg-pink-100">
                        <Brain className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <Separator />
            
            {/* Input Area */}
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleRecording}
                  className={isRecording ? 'bg-red-100 text-red-600' : ''}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what's on your mind... I'm here to listen and support you."
                    className="pr-10"
                    disabled={sendMessageMutation.isPending}
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
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                This AI provides support but is not a replacement for professional mental health care.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentalHealthPage;
