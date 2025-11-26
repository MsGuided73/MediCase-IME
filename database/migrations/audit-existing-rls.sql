-- Comprehensive RLS Audit and Implementation for Sherlock Health
-- This script audits all existing tables and creates missing RLS policies

-- =============================================
-- AUDIT: Check current RLS status on all tables
-- =============================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- ENABLE RLS ON ALL USER DATA TABLES
-- =============================================

-- Core user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE differential_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Chat and voice tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_words ENABLE ROW LEVEL SECURITY;

-- Lab integration tables
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_analyses ENABLE ROW LEVEL SECURITY;

-- Wearable device tables
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_alerts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE MISSING RLS POLICIES FOR CORE TABLES
-- =============================================

-- USERS TABLE POLICIES
-- Note: Users should only access their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- MEDICAL HISTORY POLICIES
CREATE POLICY "Users can view own medical history" ON medical_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own medical history" ON medical_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own medical history" ON medical_history
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own medical history" ON medical_history
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- SYMPTOM SETS POLICIES
CREATE POLICY "Users can view own symptom sets" ON symptom_sets
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own symptom sets" ON symptom_sets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own symptom sets" ON symptom_sets
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own symptom sets" ON symptom_sets
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- SYMPTOM ENTRIES POLICIES
CREATE POLICY "Users can view own symptom entries" ON symptom_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own symptom entries" ON symptom_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own symptom entries" ON symptom_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own symptom entries" ON symptom_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- DIFFERENTIAL DIAGNOSES POLICIES
CREATE POLICY "Users can view own diagnoses" ON differential_diagnoses
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own diagnoses" ON differential_diagnoses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own diagnoses" ON differential_diagnoses
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own diagnoses" ON differential_diagnoses
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- PRESCRIPTIONS POLICIES
CREATE POLICY "Users can view own prescriptions" ON prescriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own prescriptions" ON prescriptions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own prescriptions" ON prescriptions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own prescriptions" ON prescriptions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- CHAT AND VOICE CONVERSATION POLICIES
-- =============================================

-- CHAT CONVERSATIONS POLICIES
CREATE POLICY "Users can view own chat conversations" ON chat_conversations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own chat conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own chat conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own chat conversations" ON chat_conversations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own chat messages" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own chat messages" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

-- CONVERSATION MEMORY POLICIES
CREATE POLICY "Users can view own conversation memory" ON conversation_memory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = conversation_memory.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own conversation memory" ON conversation_memory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = conversation_memory.conversation_id
            AND chat_conversations.user_id::text = auth.uid()::text
        )
    );

-- VOICE CONVERSATIONS POLICIES
CREATE POLICY "Users can view own voice conversations" ON voice_conversations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own voice conversations" ON voice_conversations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own voice conversations" ON voice_conversations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own voice conversations" ON voice_conversations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- VOICE TRANSCRIPTS POLICIES
CREATE POLICY "Users can view own voice transcripts" ON voice_transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM voice_conversations
            WHERE voice_conversations.id = voice_transcripts.conversation_id
            AND voice_conversations.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own voice transcripts" ON voice_transcripts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voice_conversations
            WHERE voice_conversations.id = voice_transcripts.conversation_id
            AND voice_conversations.user_id::text = auth.uid()::text
        )
    );

-- VOICE WORDS POLICIES
CREATE POLICY "Users can view own voice words" ON voice_words
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM voice_transcripts vt
            JOIN voice_conversations vc ON vc.id = vt.conversation_id
            WHERE vt.id = voice_words.transcript_id
            AND vc.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own voice words" ON voice_words
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voice_transcripts vt
            JOIN voice_conversations vc ON vc.id = vt.conversation_id
            WHERE vt.id = voice_words.transcript_id
            AND vc.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- LAB INTEGRATION POLICIES
-- =============================================

-- LAB REPORTS POLICIES
CREATE POLICY "Users can view own lab reports" ON lab_reports
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own lab reports" ON lab_reports
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own lab reports" ON lab_reports
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own lab reports" ON lab_reports
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- LAB VALUES POLICIES
CREATE POLICY "Users can view own lab values" ON lab_values
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_values.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own lab values" ON lab_values
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_values.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own lab values" ON lab_values
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_values.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own lab values" ON lab_values
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_values.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

-- LAB ANALYSES POLICIES
CREATE POLICY "Users can view own lab analyses" ON lab_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_analyses.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own lab analyses" ON lab_analyses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lab_reports
            WHERE lab_reports.id = lab_analyses.report_id
            AND lab_reports.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- WEARABLE DEVICE POLICIES
-- =============================================

-- WEARABLE DEVICES POLICIES
CREATE POLICY "Users can view own wearable devices" ON wearable_devices
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own wearable devices" ON wearable_devices
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wearable devices" ON wearable_devices
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own wearable devices" ON wearable_devices
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- WEARABLE METRICS POLICIES
CREATE POLICY "Users can view own wearable metrics" ON wearable_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own wearable metrics" ON wearable_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wearable metrics" ON wearable_metrics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own wearable metrics" ON wearable_metrics
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- WEARABLE SESSIONS POLICIES
CREATE POLICY "Users can view own wearable sessions" ON wearable_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own wearable sessions" ON wearable_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wearable sessions" ON wearable_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own wearable sessions" ON wearable_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- WEARABLE ALERTS POLICIES
CREATE POLICY "Users can view own wearable alerts" ON wearable_alerts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own wearable alerts" ON wearable_alerts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wearable alerts" ON wearable_alerts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own wearable alerts" ON wearable_alerts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =============================================

-- Core tables
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON medical_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON symptom_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON symptom_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON differential_diagnoses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Chat and voice tables
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_transcripts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_words TO authenticated;

-- Lab integration tables
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_values TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_analyses TO authenticated;

-- Wearable device tables
GRANT SELECT, INSERT, UPDATE, DELETE ON wearable_devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wearable_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wearable_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wearable_alerts TO authenticated;

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- FINAL VERIFICATION QUERIES
-- =============================================

-- Verify all tables have RLS enabled
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

-- Count policies per table
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show all policies for verification
SELECT
    tablename,
    policyname,
    cmd as operation,
    CASE
        WHEN qual IS NOT NULL THEN 'Has WHERE clause'
        ELSE 'No WHERE clause'
    END as has_filter,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has CHECK clause'
        ELSE 'No CHECK clause'
    END as has_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
