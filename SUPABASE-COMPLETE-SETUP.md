# 🚀 COMPLETE SUPABASE SETUP GUIDE
**Everything you need to do in your Supabase dashboard to fix the 401/500 errors**

## 📋 STEP-BY-STEP CHECKLIST

### **STEP 1: Open Your Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/xtuhcegbdnkudctkfpyd
2. Make sure you're logged in

---

### **STEP 2: Deploy Database Schema (CRITICAL)**

Go to **SQL Editor** in the left sidebar, then:

#### **2A: Deploy Meal Tracking Schema**
1. Click **"New Query"**
2. Copy the ENTIRE contents of `database/migrations/meal-tracking-schema.sql`
3. Paste into the SQL editor
4. Click **"Run"** button
5. Should see: "Success. No rows returned"

#### **2B: Deploy Meal Tracking RLS**
1. Click **"New Query"** again
2. Copy the ENTIRE contents of `database/migrations/meal-tracking-rls.sql`
3. Paste into the SQL editor
4. Click **"Run"** button
5. Should see: "Success. No rows returned"

#### **2C: Deploy Comprehensive RLS**
1. Click **"New Query"** again
2. Copy the ENTIRE contents of `database/migrations/audit-existing-rls.sql`
3. Paste into the SQL editor
4. Click **"Run"** button
5. Should see: "Success. No rows returned"

#### **2D: Deploy Mental Health Schema**
1. Click **"New Query"** again
2. Copy and paste the following SQL:

```sql
-- Mental Health Assessment Tables
CREATE TABLE IF NOT EXISTS mental_health_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('PHQ9', 'GAD7', 'PSS10')),
  responses TEXT NOT NULL, -- JSON string of responses
  total_score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  recommendations TEXT NOT NULL, -- JSON string of recommendations
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10), -- 1-10 scale
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10), -- 1-10 scale
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  emotional_tone TEXT, -- JSON string of emotional tones
  cognitive_patterns TEXT, -- JSON string of patterns
  recommendations TEXT, -- JSON string of AI recommendations
  risk_factors TEXT, -- JSON string of risk factors
  tags TEXT, -- JSON string of tags
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Therapeutic Sessions Table
CREATE TABLE IF NOT EXISTS therapeutic_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('breathing', 'mindfulness', 'progressive_relaxation', 'guided_imagery')),
  duration INTEGER NOT NULL, -- in minutes
  completion_rate REAL NOT NULL CHECK (completion_rate >= 0 AND completion_rate <= 1), -- 0-1
  heart_rate_data TEXT, -- JSON string of heart rate data
  stress_reduction REAL, -- before/after stress level difference
  user_feedback TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mental_health_assessments_user_id ON mental_health_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_health_assessments_timestamp ON mental_health_assessments(timestamp);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_timestamp ON journal_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_therapeutic_sessions_user_id ON therapeutic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_sessions_timestamp ON therapeutic_sessions(timestamp);

-- Enable Row Level Security
ALTER TABLE mental_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Mental Health Assessments Policies
CREATE POLICY "Users can view their own mental health assessments" ON mental_health_assessments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own mental health assessments" ON mental_health_assessments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own mental health assessments" ON mental_health_assessments
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own mental health assessments" ON mental_health_assessments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Journal Entries Policies
CREATE POLICY "Users can view their own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Therapeutic Sessions Policies
CREATE POLICY "Users can view their own therapeutic sessions" ON therapeutic_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own therapeutic sessions" ON therapeutic_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own therapeutic sessions" ON therapeutic_sessions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own therapeutic sessions" ON therapeutic_sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);
```

3. Click **"Run"** button
4. Should see: "Success. No rows returned"

---

### **STEP 3: Enable Row Level Security (CRITICAL)**

Go to **Table Editor** in the left sidebar:

**For EACH of these tables, do the following:**
- users
- medical_history
- symptom_sets
- symptom_entries
- differential_diagnoses
- prescriptions
- notifications
- chat_conversations
- chat_messages
- conversation_memory
- voice_conversations
- voice_transcripts
- voice_words
- lab_reports
- lab_values
- lab_analyses
- wearable_devices
- wearable_metrics
- wearable_sessions
- wearable_alerts
- meal_entries
- food_items
- nutrition_goals
- meal_recommendations
- mental_health_assessments
- journal_entries
- therapeutic_sessions

**Steps for each table:**
1. Click on the table name
2. Click the **"Settings"** tab (next to "Insert row")
3. Find **"Enable Row Level Security"**
4. Toggle it **ON** (should turn green)
5. Click **"Save"**

---

### **STEP 4: Fix Authentication Settings**

Go to **Authentication** → **URL Configuration**:

1. Set **Site URL** to: `http://localhost:5173`
2. In **Redirect URLs**, add: `http://localhost:5173`
3. Click **"Save"**

---

### **STEP 5: Configure API Settings**

Go to **Settings** → **API**:

1. Scroll to **CORS origins**
2. Add: `http://localhost:5173`
3. Click **"Save"**

---

### **STEP 6: Verify Your Setup**

#### **6A: Check Tables Exist**
Go to **Table Editor** and verify you see all these tables:
- ✅ users
- ✅ medical_history
- ✅ symptom_entries
- ✅ meal_entries (NEW)
- ✅ food_items (NEW)
- ✅ nutrition_goals (NEW)
- ✅ meal_recommendations (NEW)
- ✅ mental_health_assessments (NEW)
- ✅ journal_entries (NEW)
- ✅ therapeutic_sessions (NEW)

#### **6B: Verify RLS is Enabled**
In **SQL Editor**, run this query:
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
ORDER BY tablename;
```

**Expected Result**: ALL tables should show "✅ RLS Enabled"

---

### **STEP 7: Test Authentication**

#### **7A: Create Test User (Optional)**
Go to **Authentication** → **Users**:
1. Click **"Add user"**
2. Enter email: `test@example.com`
3. Enter password: `testpassword123`
4. Click **"Create user"**

#### **7B: Test in Application**
1. Go to your app: http://localhost:5173
2. Try to sign up or log in
3. Test meal photo upload

---

## 🚨 TROUBLESHOOTING

### **If you still get 401/500 errors:**

1. **Check RLS Policies**: Go to **Authentication** → **Policies** and verify policies exist
2. **Check Site URL**: Must be exactly `http://localhost:5173`
3. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
4. **Restart Servers**: Stop and restart both frontend and backend

### **If tables are missing:**
1. Re-run the SQL migration scripts
2. Check for error messages in SQL Editor
3. Verify you have proper permissions

### **If RLS won't enable:**
1. Make sure you're the project owner
2. Try refreshing the page
3. Check if there are existing policies blocking it

---

## ✅ SUCCESS INDICATORS

You'll know it's working when:
- ✅ All tables show "RLS Enabled" in the verification query
- ✅ No 401/500 errors in browser console
- ✅ Meal photo upload works
- ✅ User can sign up/login successfully

---

## 📞 NEED HELP?

If you encounter issues:
1. Check the browser console for specific error messages
2. Look at the Supabase logs in **Logs** → **API**
3. Verify your .env.local file has the correct keys from **Settings** → **API**

**Your Supabase Project URL**: https://supabase.com/dashboard/project/xtuhcegbdnkudctkfpyd
