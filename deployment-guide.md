# 🚀 Sherlock Health Deployment Guide

This guide covers deployment options for Sherlock Health, from local development to production cloud hosting.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager
- **Git** - Version control

### Required Services
- **Supabase Account** - Database and authentication
- **OpenAI API Key** - GPT-4o model access
- **Anthropic API Key** - Claude 3.5 Sonnet access
- **Perplexity API Key** - Medical research engine
- **ElevenLabs API Key** (optional) - Voice synthesis

## 🏠 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/sherlock-health.git
cd sherlock-health
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your API keys
```

Required environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Service API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Application Configuration
NODE_ENV=development
PORT=5000
```

### 3. Database Setup
```bash
# Test database connection
npm run test:db

# Verify API keys
npm run test:keys
```

### 4. Start Development Server
```bash
# Windows
npm run dev:win

# Linux/Mac
npm run dev
```

Visit `http://localhost:5000` to access the application.

## ☁️ Cloud Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Backend (Railway):**
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Configure custom domain if needed

### Option 2: Netlify + Render

**Frontend (Netlify):**
1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist/public`

**Backend (Render):**
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables

### Option 3: AWS Deployment

**Frontend (S3 + CloudFront):**
1. Build application: `npm run build`
2. Upload to S3 bucket
3. Configure CloudFront distribution

**Backend (EC2 or Lambda):**
1. Create EC2 instance or Lambda function
2. Deploy Node.js application
3. Configure load balancer if needed

## 🗄️ Database Deployment

### Supabase Setup
1. Create new Supabase project
2. Configure authentication settings
3. Set up Row Level Security (RLS) policies
4. Import schema from `shared/schema.ts`

### Environment Variables
```env
# Production Supabase URLs
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔧 Build Configuration

### Frontend Build
```bash
npm run build
```
Outputs to `dist/public/` directory.

### Backend Build
TypeScript files are compiled automatically by the runtime.

## 🔐 Security Configuration

### Environment Variables
- Never commit API keys to version control
- Use platform-specific environment variable management
- Rotate keys regularly

### Supabase Security
- Enable Row Level Security (RLS)
- Configure proper authentication policies
- Set up database backups

### HTTPS Configuration
- Use SSL certificates for production
- Configure CORS properly
- Implement rate limiting

## 📊 Monitoring & Logging

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user engagement metrics

### Database Monitoring
- Monitor Supabase dashboard
- Set up alerts for high usage
- Regular backup verification

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] API keys valid and tested
- [ ] Build process successful

### Post-Deployment
- [ ] Application accessible
- [ ] Authentication working
- [ ] AI services responding
- [ ] Database connections stable
- [ ] Error monitoring active

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      # Deploy steps here
```

## 🆘 Troubleshooting

### Common Issues
1. **API Key Errors**: Verify all keys are correctly set
2. **Database Connection**: Check Supabase URL and keys
3. **Build Failures**: Ensure all dependencies installed
4. **CORS Errors**: Configure proper origins in Supabase

### Support Resources
- Check application logs
- Review Supabase dashboard
- Monitor API service status pages
- GitHub Issues for bug reports

## 📈 Scaling Considerations

### Performance Optimization
- Enable CDN for static assets
- Implement caching strategies
- Optimize database queries
- Use connection pooling

### Cost Management
- Monitor API usage limits
- Optimize AI model calls
- Use appropriate Supabase plan
- Implement usage analytics

---

**Need help?** Check the [README.md](README.md) for additional setup instructions or create an issue on GitHub.
