# 🩺 Sherlock Health - AI-Powered Medical Symptom Tracker

An intelligent medical symptom assessment application that leverages multiple AI models to provide differential diagnosis suggestions, tracks symptom progression, and manages prescriptions with evidence-based insights.

## ✨ Features

### 🤖 AI-Powered Diagnosis
- **Multi-AI Analysis**: Claude 3.5 Sonnet, GPT-4o, and Perplexity AI
- **Differential Diagnosis**: Confidence-scored medical assessments
- **Research Integration**: Evidence-based recommendations with source citations
- **Urgency Assessment**: Red flag detection and triage recommendations

### 📊 Comprehensive Tracking
- **Symptom Management**: Detailed symptom entry with severity, location, and timing
- **Prescription Tracking**: Medication effectiveness and side effect monitoring
- **Medical History**: Comprehensive health record management
- **Progress Monitoring**: Symptom progression and pattern recognition

### 🎙️ Advanced Interface
- **Voice Integration**: ElevenLabs text-to-speech for accessibility
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Real-time Chat**: Conversational AI interface for natural interaction
- **Comparison Mode**: Side-by-side AI model analysis

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom design system
- **Radix UI** for accessible components
- **TanStack Query** for state management
- **Framer Motion** for animations

### Backend
- **Node.js** with Express and TypeScript
- **Supabase** PostgreSQL with custom storage interface
- **Supabase Authentication** with automatic session management
- **Real-time** capabilities through Supabase subscriptions

### AI & Services
- **Anthropic Claude 3.5 Sonnet** - Primary medical analysis
- **OpenAI GPT-4o** - Conversational interface
- **Perplexity AI** - Medical research and citations
- **ElevenLabs** - Voice synthesis
- **Supabase** - Database and authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- API keys for AI services

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/sherlock-health.git
cd sherlock-health
npm install
```

### 2. Environment Setup

**Windows PowerShell:**
```powershell
# Copy environment template
Copy-Item .env.local.example .env.local

# Add your API keys to .env.local
# See setup-secrets.md for detailed instructions
```

**Linux/Mac:**
```bash
# Copy environment template
cp .env.local.example .env.local

# Add your API keys to .env.local
# See setup-secrets.md for detailed instructions
```

### 3. Database Setup
```bash
# Set up database (see database-setup.md)
npm run db:push

# Test database connection
npm run test:db
```

### 4. Test API Keys
```bash
npm run test:keys
```

### 5. Start Development Server
```bash
npm run dev:win  # Windows
npm run dev      # Linux/Mac
```

Visit `http://localhost:5000` to see the application.

## 📚 Documentation

- **[Setup Secrets](setup-secrets.md)** - Secure API key configuration
- **[Database Setup](database-setup.md)** - Database configuration options
- **[Supabase Setup](supabase-setup.md)** - Complete Supabase integration guide
- **[TODO](todo.md)** - Development roadmap and current status

## 🔧 Available Scripts

**Windows PowerShell:**
```powershell
npm run dev:win         # Start development server
npm run build:win       # Build for production
npm run start:win       # Start production server
npm run test:keys:win   # Test API key configuration
npm run test:db:win     # Test database connection
npm run setup:auth:win  # Authentication setup assistant
npm run setup:github:win # GitHub setup assistant

```

**Linux/Mac:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test:keys    # Test API key configuration
npm run test:db      # Test database connection
npm run setup:auth   # Authentication setup assistant
npm run setup:github # GitHub setup assistant
```

**Database Commands (Cross-platform):**
```bash
npm run db:push      # Push schema to database
npm run db:studio    # Open database visual editor
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with 7 main tables:

- **users** - User accounts and medical profiles
- **medical_history** - Past medical conditions and diagnoses
- **symptom_sets** - Grouped symptom collections
- **symptom_entries** - Individual symptom records with AI analysis
- **differential_diagnoses** - AI-generated diagnostic assessments
- **prescriptions** - Medication tracking and effectiveness
- **notifications** - User alerts and reminders

## 🔐 Security & Privacy

- **HIPAA-Compliant Design** - Secure handling of medical data
- **Environment Variables** - API keys never committed to version control
- **Row Level Security** - Database-level access control with Supabase
- **Supabase Authentication** - Secure session management with automatic token refresh
- **Input Validation** - Comprehensive data sanitization and type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

**This application is for informational and educational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.**

## 🆘 Support

- **Documentation**: Check the setup guides in the repository
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🙏 Acknowledgments

- **Anthropic** for Claude AI capabilities
- **OpenAI** for GPT-4o integration
- **Perplexity** for research and citation features
- **ElevenLabs** for voice synthesis
- **Supabase** for database and authentication services

---

**Built with ❤️ for better healthcare accessibility**
