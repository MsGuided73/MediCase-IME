import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Share2, 
  Trash2,
  Clock,
  Users,
  Stethoscope,
  TrendingUp,
  MoreHorizontal,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

const VoiceHistory: React.FC = () => {
  const [, navigate] = useLocation();
  const [conversations, setConversations] = useState<VoiceConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<VoiceConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Load real data from API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/voice/conversations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        });

        if (response.ok) {
          const conversations = await response.json();
          setConversations(conversations);
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error loading voice conversations:', error);
        setConversations([]);
      }
    };

    loadConversations();
  }, []);

  // Filter and search conversations
  useEffect(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.medicalTermsDetected?.some(term => 
          term.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply mode filter
    if (filterMode !== 'all') {
      filtered = filtered.filter(conv => conv.transcriptionMode === filterMode);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0);
        case 'medicalTerms':
          return (b.medicalTermsDetected?.length || 0) - (a.medicalTermsDetected?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, filterMode, sortBy]);

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
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    return quality === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewConversation = (id: number) => {
    navigate(`/voice/conversation/${id}`);
  };

  const handleExport = (id: number) => {
    // Implement export functionality
    console.log('Export conversation:', id);
  };

  const handleShare = (id: number) => {
    // Implement share functionality
    console.log('Share conversation:', id);
  };

  const handleDelete = (id: number) => {
    // Implement delete functionality
    console.log('Delete conversation:', id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Voice Conversations</h1>
            <p className="text-muted-foreground">Manage and review your voice recordings</p>
          </div>
        </div>
        <Button onClick={() => navigate('/voice/record')}>
          <Clock className="h-4 w-4 mr-2" />
          New Recording
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations, medical terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="elevenlabs">Enhanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="medicalTerms">Medical Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.map((conversation) => (
          <Card key={conversation.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getTranscriptionModeIcon(conversation.transcriptionMode)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {conversation.title || `Conversation ${conversation.id}`}
                      </h3>
                      <Badge variant="outline" className={getQualityColor(conversation.quality)}>
                        {conversation.quality}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {conversation.transcriptionMode}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(conversation.duration || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {conversation.speakerCount || 1} speaker{(conversation.speakerCount || 1) > 1 ? 's' : ''}
                      </span>
                      {conversation.confidence && (
                        <span className={`flex items-center gap-1 ${getConfidenceColor(conversation.confidence)}`}>
                          <BarChart3 className="h-3 w-3" />
                          {(conversation.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(conversation.updatedAt)}
                      </span>
                    </div>

                    {conversation.medicalTermsDetected && conversation.medicalTermsDetected.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="text-sm text-muted-foreground mr-2">Medical terms:</span>
                        {conversation.medicalTermsDetected.slice(0, 5).map((term, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Stethoscope className="h-3 w-3 mr-1" />
                            {term}
                          </Badge>
                        ))}
                        {conversation.medicalTermsDetected.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{conversation.medicalTermsDetected.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewConversation(conversation.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport(conversation.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(conversation.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(conversation.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterMode !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start your first voice recording to see it here'
              }
            </p>
            {!searchQuery && filterMode === 'all' && (
              <Button onClick={() => navigate('/voice/record')}>
                <Clock className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceHistory; 