# 🚀 Supabase Setup Guide

## Overview
Supabase provides both **database** and **authentication** services. This guide will help you set up both.

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Choose organization and fill project details
5. Wait for project to be created (~2 minutes)

### 2. Get Database Connection
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** format connection string
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

### 3. Add to Environment
Add to your `.env.local`:
```bash
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres

# Supabase Config
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 🔐 Authentication Setup

### 1. Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:5000` (for development)
   - **Redirect URLs**: Add your production URLs later
   - **Email templates**: Customize if needed

### 2. Enable Auth Providers
1. Go to **Authentication** → **Providers**
2. Configure **Email** (enabled by default)
3. Optionally enable:
   - Google OAuth
   - GitHub OAuth
   - Other providers

### 3. Set Up Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirm signup
   - Reset password
   - Magic link

## 📊 Database Schema Migration

### 1. Create Tables
```bash
# Push your schema to Supabase
npm run db:push
```

### 2. Verify Tables
```bash
# Test database connection
npm run test:db
```

### 3. Check in Supabase Dashboard
1. Go to **Table Editor**
2. Verify all 7 tables are created:
   - users
   - medical_history
   - symptom_sets
   - symptom_entries
   - differential_diagnoses
   - prescriptions
   - notifications

## 🔄 Migration Options

### Option A: Use Supabase Auth (Recommended)
- ✅ Built-in email verification
- ✅ Password reset
- ✅ Social logins
- ✅ Session management
- ✅ Row Level Security (RLS)

### Option B: Keep Current JWT Auth
- ✅ Full control
- ✅ Custom logic
- ❌ More maintenance

### Option C: Hybrid Approach
- Use Supabase for database
- Keep JWT for auth
- Migrate auth later

## 🛡️ Row Level Security (RLS)

### Enable RLS on Tables
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE differential_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Create Policies
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Similar policies for other tables
CREATE POLICY "Users can view own medical history" ON medical_history
  FOR ALL USING (auth.uid()::text = user_id);
```

## 🧪 Testing Setup

### 1. Test Database
```bash
npm run test:db
```

### 2. Test Auth (after setup)
```bash
npm run dev:win
```

### 3. Test in Browser
1. Go to `http://localhost:5000`
2. Try registration
3. Check email for verification
4. Try login

## 🔧 Environment Variables Summary

Add these to `.env.local`:
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

And for the frontend, add to `.env` or Vite config:
```bash
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 🚀 Next Steps

1. **Complete Supabase setup** (database + auth keys)
2. **Run migrations** (`npm run db:push`)
3. **Test connection** (`npm run test:db`)
4. **Choose auth approach** (Supabase vs JWT)
5. **Test the application** (`npm run dev:win`)

## 🆘 Troubleshooting

**Connection issues:**
- Check DATABASE_URL format
- Verify password is correct
- Check network/firewall

**Auth issues:**
- Verify SUPABASE_URL and keys
- Check Site URL in Supabase settings
- Ensure email provider is configured

**Migration issues:**
- Check database permissions
- Verify schema syntax
- Try manual table creation in Supabase dashboard
