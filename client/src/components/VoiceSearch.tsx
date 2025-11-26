import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Play, 
  BarChart3,
  Stethoscope,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  MoreHorizontal,
  Download,
  Share2,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';

interface SearchResult {
  conversationId: number;
  conversationTitle: string;
  duration: number;
  timestamp: string; // When the term appears in the conversation
  confidence: number;
  medicalTerm: string;
  context: string; // Text around the medical term
  speaker?: string;
  transcriptionMode: 'hybrid' | 'realtime' | 'elevenlabs';
  createdAt: string;
}

interface RelatedTerm {
  term: string;
  frequency: number;
  category: 'condition' | 'symptom' | 'medication' | 'procedure' | 'measurement';
}

const VoiceSearch: React.FC = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [relatedTerms, setRelatedTerms] = useState<RelatedTerm[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Mock search results - replace with actual API calls
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setRelatedTerms([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch real search results from API
    try {
      const response = await fetch(`/api/voice/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching voice data:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'condition': return 'bg-red-100 text-red-800';
      case 'symptom': return 'bg-orange-100 text-orange-800';
      case 'medication': return 'bg-blue-100 text-blue-800';
      case 'procedure': return 'bg-purple-100 text-purple-800';
      case 'measurement': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTranscriptionModeIcon = (mode: string) => {
    switch (mode) {
      case 'hybrid': return <TrendingUp className="h-4 w-4" />;
      case 'realtime': return <Clock className="h-4 w-4" />;
      case 'elevenlabs': return <Stethoscope className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const handleViewConversation = (conversationId: number) => {
    navigate(`/voice/conversation/${conversationId}`);
  };

  const handlePlaySegment = (conversationId: number, timestamp: string) => {
    // Implement audio playback for specific segment
    console.log('Play segment:', conversationId, timestamp);
  };

  const handleExport = (conversationId: number) => {
    console.log('Export conversation:', conversationId);
  };

  const handleShare = (conversationId: number) => {
    console.log('Share conversation:', conversationId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Search className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Terms Search</h1>
            <p className="text-muted-foreground">Search across all voice conversations for medical terms</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/voice')}>
          <Stethoscope className="h-4 w-4 mr-2" />
          Back to Voice Hub
        </Button>
      </div>

      {/* Search Interface */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for medical terms, symptoms, medications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="condition">Conditions</SelectItem>
                  <SelectItem value="symptom">Symptoms</SelectItem>
                  <SelectItem value="medication">Medications</SelectItem>
                  <SelectItem value="procedure">Procedures</SelectItem>
                  <SelectItem value="measurement">Measurements</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {isSearching && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching conversations...</p>
          </CardContent>
        </Card>
      )}

      {!isSearching && searchQuery && (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            {searchResults.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getTranscriptionModeIcon(result.transcriptionMode)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {result.conversationTitle}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {result.transcriptionMode}
                          </Badge>
                          <Badge variant="secondary">
                            {result.timestamp}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
                          </span>
                          {result.speaker && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {result.speaker}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 ${getConfidenceColor(result.confidence)}`}>
                            <BarChart3 className="h-3 w-3" />
                            {(result.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-lg mb-3">
                          <p 
                            className="text-sm"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerm(result.context, result.medicalTerm)
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            <Stethoscope className="h-3 w-3 mr-1" />
                            {result.medicalTerm}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlaySegment(result.conversationId, result.timestamp)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewConversation(result.conversationId)}
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
                          <DropdownMenuItem onClick={() => handleExport(result.conversationId)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(result.conversationId)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Related Medical Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {relatedTerms.map((term, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${getCategoryColor(term.category)}`}
                      onClick={() => setSearchQuery(term.term)}
                    >
                      <Stethoscope className="h-3 w-3 mr-1" />
                      {term.term} ({term.frequency})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isSearching && searchQuery && searchResults.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try searching for different medical terms or check your spelling
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('headache')}
              >
                headache
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('diabetes')}
              >
                diabetes
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('hypertension')}
              >
                hypertension
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Search Medical Terms</h3>
            <p className="text-muted-foreground mb-6">
              Enter a medical term to search across all your voice conversations
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('chest pain')}
              >
                chest pain
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('migraine')}
              >
                migraine
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('insulin')}
              >
                insulin
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery('blood pressure')}
              >
                blood pressure
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceSearch; 