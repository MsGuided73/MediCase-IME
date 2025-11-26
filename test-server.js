console.log('🚀 Testing basic server startup...');
console.log('📍 Node.js version:', process.version);
console.log('📂 Current directory:', process.cwd());

// Test if we can load the environment (ES module syntax)
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

console.log('🔧 Environment check:');
console.log('   PORT:', process.env.PORT || 'Not set (will use 5000)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');

// Test basic Express server (ES module syntax)
import express from 'express';
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sherlock Health Backend is running!',
    timestamp: new Date().toISOString(),
    port: port
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Sherlock Health API' });
});

app.listen(port, () => {
  console.log('');
  console.log('🎉 SUCCESS! Basic server is running!');
  console.log(`📍 Server URL: http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
