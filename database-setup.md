# 🗄️ Database Setup Guide

## Current Schema Status
✅ **Database schema is already defined** in `shared/schema.ts` with 7 tables:
- `users` - User accounts and profiles
- `medical_history` - Past medical conditions  
- `symptom_sets` - Grouped symptoms
- `symptom_entries` - Individual symptom records
- `differential_diagnoses` - AI-generated diagnoses
- `prescriptions` - Medication tracking
- `notifications` - User notifications

## Database Options

### 🌟 Option A: Supabase (Recommended)
**Pros:** Free tier, built-in auth, real-time features, great dashboard
**Setup time:** 5 minutes

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

### 🚀 Option B: Neon (Serverless)
**Pros:** Serverless, auto-scaling, generous free tier
**Setup time:** 3 minutes

1. Go to [neon.tech](https://neon.tech)
2. Create account and database
3. Copy connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]
   ```

### 🛤️ Option C: Railway
**Pros:** Simple deployment, good for full-stack apps
**Setup time:** 5 minutes

1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Copy connection string
4. Add to `.env.local`

### 💻 Option D: Local PostgreSQL
**Pros:** Full control, no internet required
**Setup time:** 15 minutes

1. Install PostgreSQL locally
2. Create database: `createdb medassist_db`
3. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/medassist_db
   ```

## Quick Setup Steps (Any Option)

### 1. Choose and set up your database (see options above)

### 2. Add DATABASE_URL to .env.local
```bash
# Uncomment and replace with your actual URL
DATABASE_URL=your-database-connection-string-here
```

### 3. Generate and run migrations
```bash
# Generate migration files from schema
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

### 4. Verify setup

**Windows:**
```powershell
# Test the application
npm run dev:win
```

**Linux/Mac:**
```bash
# Test the application
npm run dev
```

## Migration Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema directly to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open database studio (visual interface)
npm run db:studio
```

## Database Schema Overview

The schema includes:
- **User management** with profiles and medical history
- **Symptom tracking** with severity, location, and timing
- **AI diagnosis** with confidence scores and recommendations
- **Prescription management** with effectiveness tracking
- **Notification system** for reminders and follow-ups

## Next Steps

1. **Choose your database option** (Supabase recommended)
2. **Get the connection string** from your chosen service
3. **Update .env.local** with the DATABASE_URL
4. **Run migrations** to create the tables
5. **Test the application**

The application will automatically:
- ✅ Validate the database connection
- ✅ Show database status in startup logs
- ✅ Handle database errors gracefully

## Troubleshooting

**Connection issues:**
- Check DATABASE_URL format
- Verify database is running
- Check firewall/network settings

**Migration issues:**
- Ensure DATABASE_URL is set
- Check database permissions
- Try `npm run db:push` for development

**Schema changes:**
- Edit `shared/schema.ts`
- Run `npm run db:generate`
- Run `npm run db:push` or `npm run db:migrate`
