// Test script to verify symptom tracking API is working
const testSymptomAPI = async () => {
  const testData = {
    symptomDescription: "I have a throbbing headache on the left side of my head that started this morning",
    bodyLocation: "Head",
    severityScore: 6,
    onsetDate: new Date().toISOString(),
    frequency: "Intermittent",
    duration: "3 hours",
    associatedSymptoms: ["Nausea", "Dizziness"],
    triggers: "Stress and lack of sleep",
    notes: "Pain is worse when I move my head quickly"
  };

  try {
    const response = await fetch('http://localhost:5000/api/symptoms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This would be a real token in production
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', result);

    if (response.ok) {
      console.log('✅ Symptom Tracking API is working correctly!');
    } else {
      console.log('❌ API Error:', result);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testSymptomAPI();
