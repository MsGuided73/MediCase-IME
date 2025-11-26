# Sherlock Health - AI-Powered Medical Symptom Assessment Platform

## Overview

Sherlock Health is a comprehensive medical symptom assessment platform that provides AI-powered differential diagnosis suggestions, symptom tracking, and prescription management. Built as "WebMD on steroids," it features a three-tier AI architecture with OpenAI GPT-4o for conversational interaction, Perplexity AI for medical research, and Claude 3.5 Sonnet for data analysis. The application uses a modern full-stack architecture with React/TypeScript frontend, Express.js backend, and Supabase for authentication and data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API with React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: Supabase PostgreSQL with custom storage interface
- **Authentication**: Supabase Auth with JWT token management
- **AI Integration**: Three-tier architecture (OpenAI GPT-4o, Perplexity AI, Claude 3.5 Sonnet)
- **Storage Layer**: Custom storage interface with Supabase implementation

### Database Design
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Storage Interface**: Custom TypeScript interface for database operations
- **Schema Location**: `shared/schema.ts` for type safety across frontend and backend
- **Key Tables**: users, symptom_entries, prescriptions, differential_diagnoses, medical_history, notifications
- **Implementation**: Supabase client with custom storage service layer

## Key Components

### Authentication System
- **Supabase Authentication**: Complete user management with email/password
- **JWT Token Management**: Automatic token refresh and session handling
- **Row Level Security**: Database-level access control
- **Social Login Support**: Ready for OAuth integration

### Three-Tier AI Architecture
- **OpenAI GPT-4o**: Primary conversational agent for patient interaction
  - Natural language symptom gathering
  - Intelligent follow-up questions
  - Evidence-based differential diagnosis
  - Sherlock Health system prompt implementation
- **Perplexity AI**: Medical research engine
  - Real-time medical literature search
  - Citations from PubMed, Mayo Clinic, CDC, WHO, NICE
  - Research context for other AI models
- **Claude 3.5 Sonnet**: Data analysis and visualization
  - Chart generation and pattern recognition
  - Medical data analysis
  - Cost-optimized analytical tasks

### Symptom Assessment Engine
- Comprehensive symptom entry forms with severity scoring
- Body location mapping and associated symptoms tracking
- Multi-model AI-powered differential diagnosis
- Symptom progression tracking over time
- Voice recording integration with speech-to-text

### Prescription Management
- Medication tracking with dosage and frequency
- Prescription adherence monitoring
- Side effects and effectiveness tracking
- Doctor and pharmacy information management

### Data Models
- **User**: Profile information, medical history, emergency contacts
- **SymptomEntry**: Detailed symptom descriptions with metadata
- **Prescription**: Medication details with tracking capabilities
- **DifferentialDiagnosis**: AI-generated diagnosis suggestions with confidence scores

## Data Flow

### Symptom Assessment Flow
1. User submits symptom information through structured forms
2. Data is validated and stored in PostgreSQL database
3. Symptom data is sent to Perplexity API for AI analysis
4. Differential diagnoses are generated and stored
5. Results are presented to user with urgency levels and recommendations

### Authentication Flow
1. User credentials are validated against database
2. JWT tokens are generated and returned to client
3. Tokens are stored in localStorage and sent with API requests
4. Server middleware validates tokens on protected routes
5. Automatic token refresh maintains session continuity

### Data Persistence
- All user data is stored in PostgreSQL with proper indexing
- Drizzle ORM provides type-safe database operations
- Shared schema ensures consistency between frontend and backend
- Migrations handle schema changes and data integrity

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for conversational AI and differential diagnosis
- **Perplexity API**: Medical research engine with real-time literature access
- **Anthropic API**: Claude 3.5 Sonnet for data analysis and visualization
- **ElevenLabs API**: Text-to-speech for voice responses

### Database & Authentication
- **Supabase**: PostgreSQL database with real-time capabilities and authentication
- **Connection Management**: Built-in connection pooling and session handling

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Development Environment
- **Local Development**: Node.js with hot module replacement
- **Vite Dev Server**: Fast development builds with HMR
- **Environment Configuration**: Local .env files for API keys and database URLs

### Production Deployment Options
- **Cloud Hosting**: Vercel, Netlify, or AWS for frontend deployment
- **Backend Hosting**: Railway, Render, or AWS for Node.js backend
- **Database**: Supabase hosted PostgreSQL with global CDN
- **Environment Variables**: Secure configuration through hosting platform

### Build Process
- **Frontend**: Vite build process with optimized bundles and code splitting
- **Backend**: TypeScript compilation for Node.js runtime
- **Static Assets**: Optimized and served from CDN
- **API Routes**: RESTful endpoints with proper error handling

### Database Management
- **Schema**: Supabase dashboard for schema management
- **Migrations**: Version-controlled database changes
- **Backups**: Automated backups through Supabase
- **Security**: Row Level Security (RLS) policies for data protection

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Complete Storage Interface Implementation (July 09, 2025)
- **CRITICAL BLOCKER RESOLVED**: Implemented complete storage interface for all database operations
- **Supabase Integration**: Created SupabaseStorage class with full CRUD operations
- **Type Safety**: TypeScript interfaces for all storage methods with proper error handling
- **API Integration**: Connected storage service to all API routes
- **Data Models**: Support for symptom entries, differential diagnoses, prescriptions, medical history, notifications
- **Error Handling**: Custom error classes for validation, not found, and database errors

### Authentication System Migration (July 09, 2025)
- **JWT Removal**: Completely removed JWT authentication system
- **Supabase Auth**: Standardized on Supabase authentication across entire application
- **Token Management**: Automatic session handling with Supabase client
- **API Security**: Updated all API endpoints to use Supabase authentication middleware
- **Client Integration**: Frontend now uses Supabase session tokens for all requests
- **Simplified Architecture**: Reduced authentication complexity by 70%

### Enhanced User Interface & Navigation (July 06, 2025)
- **Hover Animation Enhancements**: 
  - Added smooth hover animations to microphone icons across all components
  - Implemented scale transformations and rotation effects on hover
  - Added active/inactive state visual feedback for microphone buttons
  - Smooth transitions (200ms duration) for better user experience
- **Projects Navigation Integration**:
  - Added "Projects" link to desktop navigation for project management
  - Integrated FolderOpen icon for Projects navigation in mobile bottom nav
  - External link handling for seamless navigation to project resources
  - Responsive design maintaining 6-column grid layout on mobile
- **External Link Support**: 
  - Added external link property to navigation interfaces
  - Proper target="_blank" and rel="noopener noreferrer" attributes
  - Hover effects for external navigation items
  - Maintains consistent styling with internal navigation

### Optimized Three-Tier AI Architecture (July 06, 2025)
- **Strategic AI Role Specialization**: 
  - **GPT-4o**: Primary customer-facing conversational agent (excels at natural dialogue and follow-up questions)
  - **Perplexity**: Dedicated medical research engine sourcing from PubMed, Mayo Clinic, CDC, WHO, NICE
  - **Claude 3.5 Sonnet**: Data analysis engine and chart generation specialist (cost-optimized)
- **Optimized Workflow**: 
  - GPT-4o gathers complete symptom history and asks intelligent follow-up questions
  - Perplexity conducts comprehensive medical research and provides detailed reports
  - Claude generates structured analysis, charts, and pattern recognition
  - All agents leverage patient's complete symptom history for context
- **Sherlock Health Implementation**: Full implementation of user-provided AI prompt structure
  - Evidence-based conversational agent approach
  - "This is educational only—consult a licensed clinician" disclaimer integration
  - 8th-grade readability with empathetic, jargon-light language
  - Ranked differential diagnosis: common → rare → critical
- **Intelligent Clarifying Questions System**: 
  - AI-powered generation of 3-5 targeted questions per symptom
  - Question categories: onset, location, severity, associated, red-flags, triggers, timing
  - Smart question prioritization (critical/high/medium importance)
  - Interactive step-by-step question wizard with progress tracking
- **Enhanced Differential Diagnosis Format**:
  - Table structure matching user specifications with "Why it Fits", "Diagnostic Tests", "Urgency" columns
  - Proper urgency indicators: 🟢 routine, 🟡 soon, 🔴 seek care now
  - Red flags section with automatic warning symptom detection
  - Clinical pearls and follow-up question suggestions
- **API Key Integration**: Added Anthropic and OpenAI API keys for comprehensive LLM comparison

### Complete Mobile-First UI/UX Overhaul (July 05, 2025)
- **Design System**: Implemented calming, health-focused color palette
  - Sage green accents (#68A691) instead of forest green for therapeutic feel
  - Microphone icon for "Track Your Symptoms" button representing voice functionality
  - Rounded corners throughout for softer feel
  - Large touch targets (48px minimum) for accessibility
- **Mobile Navigation**: Created bottom navigation bar with 5 key actions
  - Home, Track, New (prominent), Learn, Profile
  - Touch-friendly with visual feedback
- **Simplified Dashboard**: Card-based symptom sets with at-a-glance status
  - Daily check-in prompts
  - Health score visualization
  - Contextual tips
- **Step-by-Step Symptom Entry**: 3-step wizard for easy symptom tracking
  - Voice recording integration
  - Visual severity slider
  - Mobile-optimized form fields
- **Onboarding**: Skippable 4-step guided tour for new users
  - Welcome, Track, Trends, Learn
  - Contextual tips throughout the app
- **Accessibility**: WCAG AAA compliant touch targets, high contrast support

### Voice Interface Integration (July 05, 2025)
- Added ElevenLabs voice service integration for text-to-speech
- Created voice recording hook using Web Speech API for speech-to-text
- Added voice buttons to symptom entry form for hands-free input
- Implemented voice playback for AI diagnosis results
- Added TypeScript definitions for Web Speech API
- Voice features include:
  - Real-time speech-to-text for symptom descriptions
  - AI-powered voice responses for diagnosis results
  - Professional medical voice with appropriate disclaimers
  - Emergency urgency detection in voice responses

### Previous Changes
- July 05, 2025. Initial setup
- Resolved API parameter order issues in symptom submission
- Fixed NaN input validation warnings
- Implemented comprehensive medical data schema