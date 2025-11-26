# 🗄️ Complete Database Schema & RLS Deployment Guide

## 🚀 COMPREHENSIVE DEPLOYMENT STEPS

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/xtuhcegbdnkudctkfpyd
- Navigate to **SQL Editor** in the left sidebar

### 2. Deploy Meal Tracking Schema (NEW TABLES)
- Click **"New Query"**
- Copy the entire contents of `database/migrations/meal-tracking-schema.sql`
- Paste into the SQL editor
- Click **"Run"** button
- **Expected Result**: 4 new tables created

### 3. Deploy Meal Tracking RLS Policies (NEW TABLES)
- Click **"New Query"** again
- Copy the entire contents of `database/migrations/meal-tracking-rls.sql`
- Paste into the SQL editor
- Click **"Run"** button
- **Expected Result**: RLS enabled on 4 new tables with policies

### 4. Audit & Deploy RLS for ALL Existing Tables
- Click **"New Query"** again
- Copy the entire contents of `database/migrations/audit-existing-rls.sql`
- Paste into the SQL editor
- Click **"Run"** button
- **Expected Result**: RLS enabled on ALL existing tables with comprehensive policies

### 5. Verify Complete Deployment
Run this query to verify ALL tables have RLS:
```sql
SELECT
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Missing'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;
```

**Expected Result**: ALL tables should show "✅ RLS Enabled"

## 📋 What Gets Created

### Tables:
1. **`meal_entries`** - Individual meal records with AI analysis
2. **`food_items`** - Individual foods identified within meals
3. **`nutrition_goals`** - User personalized nutrition targets
4. **`meal_recommendations`** - AI-generated meal suggestions

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Proper authentication policies for all CRUD operations

## 🔧 Alternative: Use Supabase CLI

If you have Supabase CLI installed:
```bash
supabase db reset
supabase db push
```

## ✅ After Deployment

Once the schema is deployed:
1. The meal analysis API will be able to save data to the database
2. Users will have proper data isolation through RLS
3. The nutrition tracking features will be fully functional

## 🚨 Important Notes

- **Never use the `postgres` user** in application code
- **Always use Supabase client libraries** for database access
- **RLS policies ensure data security** - each user only sees their own meals
- **The schema includes proper indexes** for performance
