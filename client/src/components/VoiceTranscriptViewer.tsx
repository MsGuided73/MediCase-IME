import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  User, 
  Stethoscope,
  Search,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VoiceTranscript {
  id: number;
  conversationId: number;
  speakerId?: string;
  speakerLabel?: string;
  text: string;
  startTime?: number;
  endTime?: number;
  confidence?: number;
  isMedicalTerm?: boolean;
  medicalTerms?: string[];
  segmentType?: 'speech' | 'silence' | 'noise' | 'music';
}

interface VoiceWord {
  id: number;
  transcriptId: number;
  word: string;
  startTime: number;
  endTime: number;
  confidence?: number;
  isMedicalTerm?: boolean;
  medicalTermCategory?: 'condition' | 'symptom' | 'medication' | 'procedure' | 'measurement';
}

interface VoiceConversation {
  id: number;
  userId: number;
  sessionId: string;
  title?: string;
  duration?: number;
  audioFileUrl?: string;
  transcriptionMode: 'hybrid' | 'realtime' | 'elevenlabs';
  quality: 'draft' | 'final';
  source: 'realtime' | 'elevenlabs' | 'hybrid';
  confidence?: number;
  processingTime?: number;
  medicalTermsDetected?: string[];
  createdAt: string;
  updatedAt: string;
}

interface VoiceTranscriptViewerProps {
  conversation: VoiceConversation;
  transcripts: VoiceTranscript[];
  words?: VoiceWord[];
  onPlayAudio?: (startTime?: number, endTime?: number) => void;
  onExport?: () => void;
  onShare?: () => void;
}

const VoiceTranscriptViewer: React.FC<VoiceTranscriptViewerProps> = ({
  conversation,
  transcripts,
  words = [],
  onPlayAudio,
  onExport,
  onShare
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<string>('all');
  const [medicalTermsOnly, setMedicalTermsOnly] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const speakers = Array.from(new Set(transcripts.map(t => t.speakerLabel || t.speakerId || 'Unknown')));
  const medicalTerms = conversation.medicalTermsDetected || [];

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightMedicalTerms = (text: string): React.ReactNode => {
    if (!medicalTerms.length) return text;

    const parts = text.split(new RegExp(`(${medicalTerms.join('|')})`, 'gi'));
    return parts.map((part, index) => {
      if (medicalTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
        return (
          <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredTranscripts = transcripts.filter(transcript => {
    const matchesSearch = !searchQuery || 
      transcript.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transcript.medicalTerms || []).some(term => 
        term.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesSpeaker = speakerFilter === 'all' || 
      (transcript.speakerLabel || transcript.speakerId || 'Unknown') === speakerFilter;
    
    const matchesMedicalFilter = !medicalTermsOnly || transcript.isMedicalTerm;

    return matchesSearch && matchesSpeaker && matchesMedicalFilter;
  });

  const handlePlaySegment = (transcript: VoiceTranscript) => {
    if (onPlayAudio && transcript.startTime !== undefined) {
      onPlayAudio(transcript.startTime, transcript.endTime);
      setIsPlaying(true);
    }
  };

  const handlePlayFullAudio = () => {
    if (onPlayAudio) {
      onPlayAudio();
      setIsPlaying(true);
    }
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMedicalTermCategoryColor = (category?: string): string => {
    switch (category) {
      case 'condition': return 'bg-red-100 text-red-800';
      case 'symptom': return 'bg-orange-100 text-orange-800';
      case 'medication': return 'bg-blue-100 text-blue-800';
      case 'procedure': return 'bg-purple-100 text-purple-800';
      case 'measurement': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            <CardTitle>{conversation.title || 'Voice Conversation'}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {conversation.transcriptionMode}
            </Badge>
            <Badge variant={conversation.quality === 'final' ? 'default' : 'outline'}>
              {conversation.quality}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
        
        {/* Conversation Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {conversation.duration ? formatTime(conversation.duration) : 'Unknown duration'}
          </div>
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4" />
            {transcripts.length} segments
          </div>
          {medicalTerms.length > 0 && (
            <div className="flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              {medicalTerms.length} medical terms
            </div>
          )}
          {conversation.confidence && (
            <div className={`flex items-center gap-1 ${getConfidenceColor(conversation.confidence)}`}>
              Confidence: {(conversation.confidence * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-4">
          {onPlayAudio && (
            <Button onClick={handlePlayFullAudio} disabled={isPlaying}>
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Play Full Audio
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Speakers</SelectItem>
                {speakers.map(speaker => (
                  <SelectItem key={speaker} value={speaker}>
                    {speaker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="medicalTermsOnly"
              checked={medicalTermsOnly}
              onChange={(e) => setMedicalTermsOnly(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="medicalTermsOnly" className="text-sm">
              Medical terms only
            </Label>
          </div>
        </div>

        {/* Medical Terms Summary */}
        {medicalTerms.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Medical Terms Detected</Label>
            <div className="flex flex-wrap gap-2">
              {medicalTerms.map((term, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transcripts */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredTranscripts.map((transcript, index) => (
              <div
                key={transcript.id}
                className={`p-3 rounded-lg border ${
                  transcript.isMedicalTerm ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[80px]">
                      <Clock className="h-3 w-3" />
                      {formatTime(transcript.startTime)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {transcript.speakerLabel || transcript.speakerId || 'Unknown'}
                      </Badge>
                    </div>

                    {transcript.confidence && (
                      <div className={`text-xs ${getConfidenceColor(transcript.confidence)}`}>
                        {(transcript.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>

                  {onPlayAudio && transcript.startTime !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlaySegment(transcript)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="mt-2 text-sm">
                  {highlightMedicalTerms(transcript.text)}
                </div>

                {transcript.medicalTerms && transcript.medicalTerms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {transcript.medicalTerms.map((term, termIndex) => (
                      <Badge key={termIndex} variant="secondary" className="text-xs">
                        {term}
                      </Badge>
                    ))}
                  </div>
                )}

                {transcript.segmentType && transcript.segmentType !== 'speech' && (
                  <Badge variant="outline" className="text-xs mt-2">
                    {transcript.segmentType}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Word-level details (if available) */}
        {words.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Word-level Analysis</Label>
            <div className="flex flex-wrap gap-1">
              {words.map((word, index) => (
                <span
                  key={index}
                  className={`text-xs px-1 py-0.5 rounded ${
                    word.isMedicalTerm 
                      ? getMedicalTermCategoryColor(word.medicalTermCategory)
                      : 'bg-gray-100'
                  }`}
                  title={`${formatTime(word.startTime)} - ${formatTime(word.endTime)}`}
                >
                  {word.word}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceTranscriptViewer; 