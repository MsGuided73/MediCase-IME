import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import fileUpload from "express-fileupload";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import WebSocketManager from "./websocket";
import {
  securityHeaders,
  apiRateLimit,
  speedLimiter,
  sanitizeInput,
  securityLogger,
  corsOptions,
  requestSizeLimiter
} from "./middleware/security";
import { securityAudit } from "./middleware/security-audit";

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' }); // Load local secrets if they exist

// Debug environment loading
console.log('🔧 Environment variables loaded:');
console.log('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Validate environment configuration (after dotenv loading)
import { validateEnv, logEnvStatus } from "./config/env-validation";
const envConfig = validateEnv();

const app = express();

// Security middleware (must be first)
app.use(securityHeaders);
app.use(securityAudit);
app.use(securityLogger);
app.use(requestSizeLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
app.use(speedLimiter);
app.use('/api/', apiRateLimit);

// Body parsing with security
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Input sanitization
app.use(sanitizeInput);

// File upload middleware for voice recordings
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Log environment status
  logEnvStatus(envConfig);

  // Register API routes
  console.log('🔧 Registering API routes...');
  registerRoutes(app);

  // Start the server
  const server = createServer(app);

  // Initialize WebSocket server
  const wsManager = new WebSocketManager(server);
  console.log('🔌 WebSocket server initialized for real-time chat');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Force development mode for testing
  const isDevelopment = true; // Always use Vite in development
  console.log('🔧 Forcing development mode for testing');

  if (isDevelopment) {
    console.log('🔧 Setting up Vite development server...');
    await setupVite(app, server);
  } else {
    console.log('🔧 Setting up static file serving...');
    serveStatic(app);
  }

  // Use configured port
  const port = envConfig.PORT;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  server.listen(port, host, () => {
    log(`🚀 Server running on http://${host}:${port}`);
    log(`📱 Frontend available at http://${host}:${port}`);
    log(`🔧 Environment: ${envConfig.NODE_ENV}`);
  });
})();
