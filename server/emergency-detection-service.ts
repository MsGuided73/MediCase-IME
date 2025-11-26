interface EmergencyKeyword {
  keyword: string;
  severity: number; // 1-10 scale
  category: 'cardiac' | 'respiratory' | 'neurological' | 'trauma' | 'psychiatric' | 'other';
  immediateAction: string;
}

interface UrgencyAssessment {
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  urgencyScore: number; // 1-10
  emergencyFlags: string[];
  immediateActions: string[];
  timeToSeekCare: string;
  recommendedCareLevel: 'self-care' | 'primary-care' | 'urgent-care' | 'emergency-room' | 'call-911';
  reasoning: string;
  confidence: number; // 0-1
}

export class EmergencyDetectionService {
  private emergencyKeywords: EmergencyKeyword[] = [
    // IMMEDIATE EMERGENCY (Call 911)
    { keyword: 'chest pain', severity: 10, category: 'cardiac', immediateAction: 'Call 911 immediately' },
    { keyword: 'heart attack', severity: 10, category: 'cardiac', immediateAction: 'Call 911 immediately' },
    { keyword: 'can\'t breathe', severity: 10, category: 'respiratory', immediateAction: 'Call 911 immediately' },
    { keyword: 'difficulty breathing', severity: 9, category: 'respiratory', immediateAction: 'Seek emergency care' },
    { keyword: 'shortness of breath', severity: 8, category: 'respiratory', immediateAction: 'Seek urgent care' },
    { keyword: 'stroke', severity: 10, category: 'neurological', immediateAction: 'Call 911 immediately' },
    { keyword: 'sudden weakness', severity: 9, category: 'neurological', immediateAction: 'Seek emergency care' },
    { keyword: 'loss of consciousness', severity: 10, category: 'neurological', immediateAction: 'Call 911 immediately' },
    { keyword: 'unconscious', severity: 10, category: 'neurological', immediateAction: 'Call 911 immediately' },
    { keyword: 'severe bleeding', severity: 9, category: 'trauma', immediateAction: 'Call 911 or go to ER' },
    { keyword: 'heavy bleeding', severity: 8, category: 'trauma', immediateAction: 'Seek emergency care' },
    { keyword: 'suicide', severity: 10, category: 'psychiatric', immediateAction: 'Call 988 or 911 immediately' },
    { keyword: 'suicidal thoughts', severity: 9, category: 'psychiatric', immediateAction: 'Call 988 or seek help' },
    { keyword: 'want to die', severity: 10, category: 'psychiatric', immediateAction: 'Call 988 or 911 immediately' },
    
    // HIGH URGENCY (Emergency Room)
    { keyword: 'severe headache', severity: 8, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'worst headache', severity: 9, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'sudden severe headache', severity: 9, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'high fever', severity: 7, category: 'other', immediateAction: 'Seek urgent care' },
    { keyword: 'fever over 103', severity: 8, category: 'other', immediateAction: 'Go to emergency room' },
    { keyword: 'severe abdominal pain', severity: 8, category: 'other', immediateAction: 'Go to emergency room' },
    { keyword: 'appendicitis', severity: 9, category: 'other', immediateAction: 'Go to emergency room' },
    { keyword: 'broken bone', severity: 7, category: 'trauma', immediateAction: 'Go to emergency room' },
    { keyword: 'fractured', severity: 7, category: 'trauma', immediateAction: 'Go to emergency room' },
    { keyword: 'allergic reaction', severity: 8, category: 'other', immediateAction: 'Use EpiPen and call 911' },
    { keyword: 'anaphylaxis', severity: 10, category: 'other', immediateAction: 'Use EpiPen and call 911' },
    
    // MEDIUM URGENCY (Urgent Care)
    { keyword: 'persistent fever', severity: 6, category: 'other', immediateAction: 'See doctor within 24 hours' },
    { keyword: 'severe pain', severity: 7, category: 'other', immediateAction: 'Seek urgent care' },
    { keyword: 'vomiting blood', severity: 9, category: 'other', immediateAction: 'Go to emergency room' },
    { keyword: 'blood in stool', severity: 7, category: 'other', immediateAction: 'See doctor today' },
    { keyword: 'blood in urine', severity: 6, category: 'other', immediateAction: 'See doctor within 24 hours' },
    { keyword: 'severe diarrhea', severity: 6, category: 'other', immediateAction: 'Stay hydrated, see doctor if persists' },
    { keyword: 'dehydration', severity: 7, category: 'other', immediateAction: 'Seek urgent care' },
    { keyword: 'severe rash', severity: 5, category: 'other', immediateAction: 'See doctor or urgent care' },
    { keyword: 'infection', severity: 6, category: 'other', immediateAction: 'See doctor within 24 hours' },
    
    // NEUROLOGICAL RED FLAGS
    { keyword: 'confusion', severity: 7, category: 'neurological', immediateAction: 'Seek urgent medical care' },
    { keyword: 'slurred speech', severity: 8, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'vision changes', severity: 7, category: 'neurological', immediateAction: 'See doctor today' },
    { keyword: 'double vision', severity: 8, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'seizure', severity: 9, category: 'neurological', immediateAction: 'Call 911 if active, ER if recent' },
    { keyword: 'numbness', severity: 6, category: 'neurological', immediateAction: 'See doctor within 24 hours' },
    { keyword: 'sudden numbness', severity: 8, category: 'neurological', immediateAction: 'Go to emergency room' },
    { keyword: 'paralysis', severity: 10, category: 'neurological', immediateAction: 'Call 911 immediately' },
  ];

  private redFlagCombinations = [
    {
      keywords: ['headache', 'fever', 'neck stiffness'],
      severity: 10,
      condition: 'Possible meningitis',
      action: 'Call 911 immediately'
    },
    {
      keywords: ['chest pain', 'shortness of breath', 'sweating'],
      severity: 10,
      condition: 'Possible heart attack',
      action: 'Call 911 immediately'
    },
    {
      keywords: ['sudden headache', 'vision changes', 'weakness'],
      severity: 10,
      condition: 'Possible stroke',
      action: 'Call 911 immediately'
    },
    {
      keywords: ['abdominal pain', 'vomiting', 'fever'],
      severity: 8,
      condition: 'Possible appendicitis or serious infection',
      action: 'Go to emergency room'
    }
  ];

  assessUrgency(symptomText: string, additionalContext?: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
    currentMedications?: string[];
    duration?: string;
    severity?: number;
  }): UrgencyAssessment {
    const normalizedText = symptomText.toLowerCase();
    const detectedKeywords: EmergencyKeyword[] = [];
    const emergencyFlags: string[] = [];
    let maxSeverity = 0;
    let totalSeverity = 0;

    // Check for individual emergency keywords
    this.emergencyKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword.keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, keyword.severity);
        totalSeverity += keyword.severity;
        
        if (keyword.severity >= 9) {
          emergencyFlags.push(`CRITICAL: ${keyword.keyword} detected`);
        } else if (keyword.severity >= 7) {
          emergencyFlags.push(`HIGH PRIORITY: ${keyword.keyword} detected`);
        }
      }
    });

    // Check for red flag combinations
    this.redFlagCombinations.forEach(combo => {
      const matchedKeywords = combo.keywords.filter(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length >= 2) {
        maxSeverity = Math.max(maxSeverity, combo.severity);
        emergencyFlags.push(`RED FLAG COMBINATION: ${combo.condition}`);
      }
    });

    // Age-based risk adjustments
    if (additionalContext?.age) {
      if (additionalContext.age > 65 && maxSeverity >= 6) {
        maxSeverity = Math.min(10, maxSeverity + 1);
        emergencyFlags.push('Age-related risk factor (65+)');
      }
      if (additionalContext.age < 2 && maxSeverity >= 5) {
        maxSeverity = Math.min(10, maxSeverity + 1);
        emergencyFlags.push('Pediatric risk factor (<2 years)');
      }
    }

    // Duration-based adjustments
    if (additionalContext?.duration) {
      const duration = additionalContext.duration.toLowerCase();
      if (duration.includes('sudden') || duration.includes('immediate')) {
        maxSeverity = Math.min(10, maxSeverity + 1);
        emergencyFlags.push('Sudden onset increases urgency');
      }
    }

    // Severity score adjustments
    if (additionalContext?.severity && additionalContext.severity >= 8) {
      maxSeverity = Math.min(10, maxSeverity + 1);
      emergencyFlags.push('High patient-reported severity (8+/10)');
    }

    return this.calculateUrgencyLevel(maxSeverity, detectedKeywords, emergencyFlags, additionalContext);
  }

  private calculateUrgencyLevel(
    maxSeverity: number, 
    detectedKeywords: EmergencyKeyword[], 
    emergencyFlags: string[],
    context?: any
  ): UrgencyAssessment {
    let urgencyLevel: UrgencyAssessment['urgencyLevel'];
    let recommendedCareLevel: UrgencyAssessment['recommendedCareLevel'];
    let timeToSeekCare: string;
    let immediateActions: string[] = [];
    let reasoning: string;
    let confidence: number;

    // Determine urgency level based on severity
    if (maxSeverity >= 9) {
      urgencyLevel = 'emergency';
      recommendedCareLevel = 'call-911';
      timeToSeekCare = 'Immediately - Call 911 now';
      immediateActions = [
        'Call 911 immediately',
        'Do not drive yourself',
        'Stay calm and follow dispatcher instructions',
        'Have someone stay with you if possible'
      ];
      reasoning = 'Life-threatening symptoms detected requiring immediate emergency care';
      confidence = 0.95;
    } else if (maxSeverity >= 7) {
      urgencyLevel = 'high';
      recommendedCareLevel = 'emergency-room';
      timeToSeekCare = 'Within 1-2 hours';
      immediateActions = [
        'Go to emergency room',
        'Do not delay seeking care',
        'Bring list of current medications',
        'Have someone drive you if possible'
      ];
      reasoning = 'Serious symptoms requiring urgent medical evaluation';
      confidence = 0.85;
    } else if (maxSeverity >= 5) {
      urgencyLevel = 'medium';
      recommendedCareLevel = 'urgent-care';
      timeToSeekCare = 'Within 24 hours';
      immediateActions = [
        'Seek urgent care or see doctor today',
        'Monitor symptoms closely',
        'Call doctor if symptoms worsen',
        'Stay hydrated and rest'
      ];
      reasoning = 'Concerning symptoms that should be evaluated promptly';
      confidence = 0.75;
    } else {
      urgencyLevel = 'low';
      recommendedCareLevel = maxSeverity >= 3 ? 'primary-care' : 'self-care';
      timeToSeekCare = maxSeverity >= 3 ? 'Within 1-2 weeks' : 'Monitor and self-care';
      immediateActions = [
        'Monitor symptoms',
        'Rest and stay hydrated',
        'Consider over-the-counter remedies',
        'Schedule routine doctor visit if symptoms persist'
      ];
      reasoning = 'Mild symptoms that can likely be managed with self-care';
      confidence = 0.65;
    }

    // Add specific actions based on detected keywords
    detectedKeywords.forEach(keyword => {
      if (!immediateActions.includes(keyword.immediateAction)) {
        immediateActions.unshift(keyword.immediateAction);
      }
    });

    return {
      urgencyLevel,
      urgencyScore: maxSeverity,
      emergencyFlags,
      immediateActions,
      timeToSeekCare,
      recommendedCareLevel,
      reasoning,
      confidence
    };
  }

  // Emergency contact numbers and resources
  getEmergencyResources() {
    return {
      emergency: {
        number: '911',
        description: 'Life-threatening emergencies'
      },
      suicide: {
        number: '988',
        description: 'Suicide & Crisis Lifeline'
      },
      poison: {
        number: '1-800-222-1222',
        description: 'Poison Control Center'
      },
      domestic: {
        number: '1-800-799-7233',
        description: 'National Domestic Violence Hotline'
      }
    };
  }

  // Check if symptoms require immediate 911 call
  requiresImmediate911(assessment: UrgencyAssessment): boolean {
    return assessment.urgencyLevel === 'emergency' || 
           assessment.recommendedCareLevel === 'call-911' ||
           assessment.emergencyFlags.some(flag => flag.includes('CRITICAL'));
  }
}

export const emergencyDetectionService = new EmergencyDetectionService();
