// Test script for mental health API
const fetch = require('node-fetch');

async function testMentalHealthAPI() {
  try {
    console.log('Testing mental health chat API...');
    
    const response = await fetch('http://localhost:5000/api/mental-health/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, I am feeling anxious today',
        conversationHistory: []
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Response is not JSON');
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testMentalHealthAPI();
