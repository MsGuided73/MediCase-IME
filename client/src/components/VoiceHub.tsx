import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  History, 
  Search, 
  BarChart3, 
  Settings,
  Plus,
  Clock,
  Users,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocation } from 'wouter';

interface VoiceConversation {
  id: number;
  title?: string;
  duration?: number;
  transcriptionMode: 'hybrid' | 'realtime' | 'elevenlabs';
  quality: 'draft' | 'final';
  source: 'realtime' | 'elevenlabs' | 'hybrid';
  confidence?: number;
  medicalTermsDetected?: string[];
  speakerCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface VoiceHubProps {
  onNewRecording?: () => void;
  onViewHistory?: () => void;
  onSearch?: () => void;
  onAnalytics?: () => void;
  onSettings?: () => void;
}

const VoiceHub: React.FC<VoiceHubProps> = ({
  onNewRecording,
  onViewHistory,
  onSearch,
  onAnalytics,
  onSettings
}) => {
  const [, navigate] = useLocation();
  const [recentConversations, setRecentConversations] = useState<VoiceConversation[]>([]);
  const [stats, setStats] = useState({
    totalRecordings: 0,
    avgDuration: 0,
    medicalTermsDetected: 0,
    topMedicalTerm: ''
  });

  // Load real data from API
  useEffect(() => {
    const loadVoiceData = async () => {
      try {
        const response = await fetch('/api/voice/conversations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        });

        if (response.ok) {
          const conversations = await response.json();
          setRecentConversations(conversations.slice(0, 3)); // Show last 3
        } else {
          setRecentConversations([]);
        }

        // Load stats
        const statsResponse = await fetch('/api/voice/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          setStats({
            totalRecordings: 0,
            avgDuration: 0,
            medicalTermsDetected: 0,
            topMedicalTerm: ''
          });
        }
      } catch (error) {
        console.error('Error loading voice data:', error);
        setRecentConversations([]);
        setStats({
          totalRecordings: 0,
          avgDuration: 0,
          medicalTermsDetected: 0,
          topMedicalTerm: ''
        });
      }
    };

    loadVoiceData();
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getTranscriptionModeIcon = (mode: string) => {
    switch (mode) {
      case 'hybrid': return <TrendingUp className="h-4 w-4" />;
      case 'realtime': return <Clock className="h-4 w-4" />;
      case 'elevenlabs': return <Stethoscope className="h-4 w-4" />;
      default: return <Mic className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    return quality === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'record':
        if (onNewRecording) onNewRecording();
        else navigate('/voice/record');
        break;
      case 'history':
        if (onViewHistory) onViewHistory();
        else navigate('/voice/history');
        break;
      case 'search':
        if (onSearch) onSearch();
        else navigate('/voice/search');
        break;
      case 'analytics':
        if (onAnalytics) onAnalytics();
        else navigate('/voice/analytics');
        break;
      case 'settings':
        if (onSettings) onSettings();
        else navigate('/voice/settings');
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Voice Hub</h1>
            <p className="text-muted-foreground">Medical-grade voice transcription & analysis</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => handleQuickAction('settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => handleQuickAction('record')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">New Recording</h3>
            <p className="text-sm text-muted-foreground">Start voice assessment</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('history')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">History</h3>
            <p className="text-sm text-muted-foreground">View transcripts</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('search')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Search</h3>
            <p className="text-sm text-muted-foreground">Find medical terms</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('analytics')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-muted-foreground">View trends</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Recordings</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalRecordings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Medical Terms</span>
            </div>
            <p className="text-2xl font-bold">{stats.medicalTermsDetected}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Top Term</span>
            </div>
            <p className="text-lg font-semibold capitalize">{stats.topMedicalTerm}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleQuickAction('history')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/voice/conversation/${conversation.id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getTranscriptionModeIcon(conversation.transcriptionMode)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {conversation.title || `Conversation ${conversation.id}`}
                      </h4>
                      <Badge variant="outline" className={getQualityColor(conversation.quality)}>
                        {conversation.quality}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(conversation.duration || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {conversation.speakerCount || 1} speaker{(conversation.speakerCount || 1) > 1 ? 's' : ''}
                      </span>
                      {conversation.medicalTermsDetected && conversation.medicalTermsDetected.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {conversation.medicalTermsDetected.length} medical terms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatTimeAgo(conversation.updatedAt)}</span>
                  {conversation.confidence && (
                    <Badge variant="secondary">
                      {(conversation.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceHub; 