import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: 'clarify' | 'differential' | 'explore' | 'safety';
  data?: any;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  category: string;
  importance: string;
  rationale: string;
}

interface DifferentialDiagnosis {
  diagnosisName: string;
  confidenceScore: number;
  reasoning: string;
  urgencyLevel: string;
  urgencyIcon: string;
  keyFeatures: string[];
  ruleOutTests: string[];
  redFlags: string[];
  sources: string[];
  specialistType?: string;
}

const PatientListenerChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm Sherlock Health, your AI health assistant. I'm here to help you explore possible causes of your symptoms. Please describe what you're experiencing, and I'll ask some clarifying questions to better understand your situation.\n\n*Remember: This is educational only—always consult a licensed clinician for medical advice.*",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setConversationContext(prev => [...prev, inputValue]);
    setInputValue('');
    setIsLoading(true);

    try {
      // For demo purposes, simulate the AI response
      // In production, this would call the actual API
      const mockResponse = await simulatePatientListenerResponse(inputValue, conversationContext);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: mockResponse.conversationalResponse,
        timestamp: new Date(),
        mode: mockResponse.mode,
        data: mockResponse
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or consult with a healthcare provider if you have urgent concerns.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreCondition = async (conditionName: string) => {
    setIsLoading(true);
    try {
      const mockExploration = await simulateConditionExploration(conditionName);
      
      const explorationMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `## Exploring: ${conditionName}\n\n${mockExploration.overview}\n\n**Diagnostic Workup:**\n${mockExploration.diagnosticWorkup.map(step => `• ${step}`).join('\n')}\n\n**Treatment Overview:**\n${mockExploration.treatmentOverview}\n\n*This is educational only—consult a licensed clinician.*`,
        timestamp: new Date(),
        mode: 'explore'
      };

      setMessages(prev => [...prev, explorationMessage]);
    } catch (error) {
      console.error('Error exploring condition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderClarifyingQuestions = (questions: ClarifyingQuestion[]) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-semibold text-blue-800 mb-3">To better understand your symptoms:</h4>
      <div className="space-y-2">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => setInputValue(q.question)}
            className="block w-full text-left p-3 bg-white rounded border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium text-gray-800">{q.question}</div>
            <div className="text-sm text-gray-600 mt-1">{q.rationale}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDifferentialDiagnosis = (diagnoses: DifferentialDiagnosis[]) => (
    <div className="mt-4 space-y-3">
      <h4 className="font-semibold text-gray-800">Possible Conditions to Consider:</h4>
      {diagnoses.map((diagnosis, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-gray-800">{diagnosis.diagnosisName}</h5>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{diagnosis.urgencyIcon}</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {diagnosis.confidenceScore}% match
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">{diagnosis.reasoning}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Key Features:</strong>
              <ul className="list-disc list-inside mt-1 text-gray-600">
                {diagnosis.keyFeatures.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong>Recommended Tests:</strong>
              <ul className="list-disc list-inside mt-1 text-gray-600">
                {diagnosis.ruleOutTests.map((test, i) => (
                  <li key={i}>{test}</li>
                ))}
              </ul>
            </div>
          </div>

          {diagnosis.redFlags.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-800">⚠️ Red Flags:</strong>
              <ul className="list-disc list-inside mt-1 text-red-700 text-sm">
                {diagnosis.redFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => handleExploreCondition(diagnosis.diagnosisName)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Explore {diagnosis.diagnosisName}
            </button>
            {diagnosis.specialistType && (
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                Consider: {diagnosis.specialistType}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <div className="p-4 border-b bg-blue-50">
        <h2 className="text-xl font-semibold text-blue-800">🔍 Sherlock Health - Patient Listener</h2>
        <p className="text-sm text-blue-600">AI-powered symptom exploration and health guidance</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.type === 'assistant' && message.data && (
                <>
                  {message.data.clarifyingQuestions && 
                    renderClarifyingQuestions(message.data.clarifyingQuestions)}
                  
                  {message.data.differential && 
                    renderDifferentialDiagnosis(message.data.differential)}
                </>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Sherlock is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your symptoms or ask a question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          This is educational only—always consult a licensed clinician for medical advice.
        </div>
      </div>
    </div>
  );
};

// Mock functions for demo purposes
async function simulatePatientListenerResponse(userInput: string, context: string[]) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock response based on input
  if (userInput.toLowerCase().includes('headache')) {
    return {
      mode: 'differential' as const,
      conversationalResponse: "I understand you're experiencing headaches. Based on your description, here are some possible conditions to consider. Let me know if any of these questions help clarify your symptoms.",
      differential: [
        {
          diagnosisName: "Tension Headache",
          confidenceScore: 75,
          reasoning: "Common type of headache often related to stress, muscle tension, or poor posture",
          urgencyLevel: "routine",
          urgencyIcon: "🟢",
          keyFeatures: ["Bilateral pressure", "Band-like sensation", "Mild to moderate intensity"],
          ruleOutTests: ["Physical examination", "Stress assessment", "Sleep pattern review"],
          redFlags: ["Sudden severe onset", "Fever", "Vision changes"],
          sources: ["Mayo Clinic", "MedlinePlus"],
          specialistType: "neurologist"
        }
      ],
      clarifyingQuestions: [
        {
          id: "q1",
          question: "When did the headaches start?",
          category: "onset",
          importance: "critical",
          rationale: "Helps determine if this is acute or chronic"
        }
      ]
    };
  }
  
  return {
    mode: 'clarify' as const,
    conversationalResponse: "Thank you for sharing that information. To better understand your symptoms and provide more accurate guidance, I'd like to ask a few clarifying questions.",
    clarifyingQuestions: [
      {
        id: "q1",
        question: "When did this symptom first start?",
        category: "onset",
        importance: "critical",
        rationale: "Understanding timing helps determine urgency and possible causes"
      },
      {
        id: "q2",
        question: "How would you rate the severity on a scale of 1-10?",
        category: "severity",
        importance: "high",
        rationale: "Severity helps prioritize care and narrow differential diagnosis"
      }
    ]
  };
}

async function simulateConditionExploration(conditionName: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    overview: `${conditionName} is a medical condition that affects many people. This educational overview provides general information about the condition, its typical presentation, and general management approaches.`,
    diagnosticWorkup: [
      "Clinical history and physical examination",
      "Relevant laboratory tests as indicated",
      "Imaging studies if appropriate",
      "Specialist consultation when needed"
    ],
    treatmentOverview: "Treatment typically involves a combination of lifestyle modifications, medical management, and follow-up care as appropriate for the individual case."
  };
}

export default PatientListenerChat;
