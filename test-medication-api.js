// Test script to verify medication API is working
const testMedicationAPI = async () => {
  const testData = {
    medicationName: "Ibuprofen",
    dosage: "400mg",
    frequency: "Three times daily",
    startDate: new Date().toISOString(),
    prescribingDoctor: "Dr. Test",
    purpose: "Pain Relief",
    notes: "Test medication entry"
  };

  try {
    const response = await fetch('http://localhost:5000/api/prescriptions', {
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
      console.log('✅ Medication API is working correctly!');
    } else {
      console.log('❌ API Error:', result);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testMedicationAPI();
