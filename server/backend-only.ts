import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 5000;

// CORS configuration for frontend on port 5173
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-auth-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

console.log('🚀 Starting Backend Server...');
console.log('🔧 Environment Configuration:');
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Port: ${PORT}`);
console.log(`   Frontend URL: http://localhost:5173`);

// Environment status
const envConfig = {
  supabaseUrl: process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
  openaiKey: process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Missing',
  anthropicKey: process.env.ANTHROPIC_API_KEY ? '✅ Available' : '❌ Missing',
  perplexityKey: process.env.PERPLEXITY_API_KEY ? '✅ Available' : '❌ Missing',
  elevenLabsKey: process.env.ELEVENLABS_API_KEY ? '✅ Available' : '❌ Missing'
};

console.log('🗄️  Database Configuration:');
console.log(`   Supabase URL: ${envConfig.supabaseUrl}`);
console.log(`   Anon Key: ${envConfig.supabaseAnonKey}`);
console.log(`   Service Role: ${envConfig.supabaseServiceKey}`);

console.log('🤖 AI Services:');
console.log(`   Anthropic Claude: ${envConfig.anthropicKey}`);
console.log(`   OpenAI GPT: ${envConfig.openaiKey}`);
console.log(`   Perplexity: ${envConfig.perplexityKey}`);
console.log(`   ElevenLabs Voice: ${envConfig.elevenLabsKey}`);

async function startServer() {
  try {
    // Register API routes
    registerRoutes(app);

    // Create HTTP server
    const { createServer } = await import("http");
    const server = createServer(app);
    
    // Start the server
    server.listen(PORT, () => {
      console.log('');
      console.log('🎉 Backend Server Started Successfully!');
      console.log('');
      console.log('📡 Server Details:');
      console.log(`   Backend API: http://localhost:${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log(`   GET  /api/symptoms`);
      console.log(`   POST /api/symptoms`);
      console.log(`   GET  /api/prescriptions`);
      console.log(`   POST /api/prescriptions`);
      console.log(`   GET  /api/dashboard/stats`);
      console.log(`   POST /api/mental-health/chat`);
      console.log('');
      console.log('⚡ Ready to serve frontend at http://localhost:5173');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Backend server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Backend server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();
