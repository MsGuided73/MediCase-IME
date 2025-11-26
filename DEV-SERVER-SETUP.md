# 🚀 Sherlock Health - Development Server Setup Guide

## Quick Start Commands

### **Option 1: Separate Frontend & Backend (Recommended)**

#### Start Backend (Port 5000)
```powershell
# Terminal 1: Start backend server
$env:NODE_ENV='development'; npx tsx server/index.ts
```

#### Start Frontend (Port 5173)
```powershell
# Terminal 2: Start frontend server (from client directory)
Set-Location client; npx vite
```

### **Option 2: Full-Stack Development (Alternative)**
```powershell
# Start both frontend and backend together (if working)
npm run dev:win
```
- **Note**: This may have PowerShell syntax issues, use Option 1 if problems occur

---

## 🔧 **Development Server Architecture**

### **Backend Server (Express + TypeScript)**
- **Port**: 5000
- **Entry Point**: `server/index.ts`
- **Features**:
  - REST API endpoints (`/api/*`)
  - File upload handling
  - Supabase integration
  - AI services (Claude, OpenAI, Perplexity)
  - WebSocket support
  - Lab analysis services (GI-MAP, PGX, CGX)

### **Frontend Server (Vite + React)**
- **Port**: 5173
- **Entry Point**: `client/index.html`
- **Features**:
  - React 18 with TypeScript
  - Hot module replacement (HMR)
  - Tailwind CSS with live reload
  - API proxy to backend (port 5000)

---

## 🛠️ **Troubleshooting Common Issues**

### **Server Won't Start**
```powershell
# Check if ports are in use
netstat -an | findstr :5000
netstat -an | findstr :5173

# Kill processes on ports if needed
npx kill-port 5000
npx kill-port 5173

# Install dependencies if missing
npm install
```

### **Environment Variables Missing**
```powershell
# Check if .env.local exists and has required keys
Get-Content .env.local | Select-String "SUPABASE"

# Test API keys
npm run test:keys:win
```

### **TypeScript Compilation Errors**
```powershell
# Check TypeScript compilation
npm run check

# Generate database types
npm run db:generate
```

### **Database Connection Issues**
```powershell
# Test database connection
npm run test:db:win

# Push schema changes
npm run db:push
```

---

## 📋 **Development Workflow**

### **Daily Development Startup**
1. **Open PowerShell** in project root directory
2. **Start development server**: `npm run dev:win`
3. **Open browser**: http://localhost:5173
4. **API available at**: http://localhost:5000/api

### **Testing Lab Upload Feature**
1. **Navigate to**: http://localhost:5173
2. **Login/Register** if needed
3. **Go to Dashboard** - look for "Upload Lab Results" card
4. **Upload GI-MAP files** - supports PDF, images, documents
5. **Check console** for upload progress and AI analysis

### **API Testing**
```powershell
# Test GI analysis API
node test-gi-analysis-api.js

# Test mental health API  
node test-mental-health-api.js

# Test medication API
node test-medication-api.js
```

---

## 🔍 **Port Configuration Reference**

### **Current Setup**
- **Frontend (Vite)**: Port 5173
- **Backend (Express)**: Port 5000
- **Database (Supabase)**: Remote hosted
- **Proxy**: Frontend `/api/*` → Backend `http://localhost:5000`

### **Environment Variables**
```bash
NODE_ENV=development
PORT=5000                    # Backend port
VITE_SUPABASE_URL=...       # Supabase project URL
VITE_SUPABASE_ANON_KEY=...  # Supabase anonymous key
```

---

## 🚨 **Emergency Commands**

### **Kill All Development Servers**
```powershell
# Kill by port
npx kill-port 5000 5173

# Or kill by process name
taskkill /f /im node.exe
taskkill /f /im tsx.exe
```

### **Clean Restart**
```powershell
# Clean install and restart
Remove-Item node_modules -Recurse -Force; npm install; npm run dev:win
```

### **Check Server Status**
```powershell
# Check if servers are running
netstat -an | findstr :5000
netstat -an | findstr :5173

# Test API endpoint
curl http://localhost:5000/api/health
```

---

## 📱 **Access URLs**

### **Main Application**
- **Frontend**: http://localhost:5173
- **Medical Dashboard**: http://localhost:5173/medical-dashboard
- **Lab Upload**: http://localhost:5173 (Dashboard → Upload Lab Results card)

### **API Endpoints**
- **Health Check**: http://localhost:5000/api/health
- **GI Analysis**: http://localhost:5000/api/gi-analysis
- **Lab Analysis**: http://localhost:5000/api/lab-analysis
- **Symptoms**: http://localhost:5000/api/symptoms

### **Development Tools**
- **Database Studio**: `npm run db:studio`
- **API Documentation**: http://localhost:5000/api/docs (if implemented)

---

## 🎯 **Quick Reference Commands**

```powershell
# Start everything
npm run dev:win

# Frontend only
npx vite

# Backend only  
npx tsx server/index.ts

# Database operations
npm run db:push          # Push schema changes
npm run db:studio        # Open database studio
npm run migrate:win      # Run migrations

# Testing
npm run test:keys:win    # Test API keys
npm run test:db:win      # Test database
node test-gi-analysis-api.js  # Test GI analysis
```

---

**💡 Pro Tip**: Bookmark this file! It contains everything you need to get the development environment running quickly.
