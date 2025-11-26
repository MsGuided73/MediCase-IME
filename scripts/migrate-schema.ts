import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starting database schema migration...');

  try {
    // Migration 1: Add missing fields to medical_history table
    console.log('📝 Migration 1: Adding treating_doctor field to medical_history...');
    const { error: medicalHistoryError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE medical_history 
        ADD COLUMN IF NOT EXISTS treating_doctor TEXT;
      `
    });

    if (medicalHistoryError) {
      console.error('❌ Error adding treating_doctor to medical_history:', medicalHistoryError);
    } else {
      console.log('✅ Added treating_doctor field to medical_history');
    }

    // Migration 2: Add missing fields to differential_diagnoses table
    console.log('📝 Migration 2: Adding ai_provider field to differential_diagnoses...');
    const { error: diagnosisError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE differential_diagnoses 
        ADD COLUMN IF NOT EXISTS ai_provider TEXT;
      `
    });

    if (diagnosisError) {
      console.error('❌ Error adding ai_provider to differential_diagnoses:', diagnosisError);
    } else {
      console.log('✅ Added ai_provider field to differential_diagnoses');
    }

    // Migration 3: Add missing fields to notifications table
    console.log('📝 Migration 3: Adding missing fields to notifications...');
    const { error: notificationError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS action_taken BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS related_entity_id TEXT;
      `
    });

    if (notificationError) {
      console.error('❌ Error adding fields to notifications:', notificationError);
    } else {
      console.log('✅ Added missing fields to notifications');
    }

    // Migration 4: Add missing fields to voice_conversations table
    console.log('📝 Migration 4: Adding missing fields to voice_conversations...');
    const { error: voiceConvError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE voice_conversations 
        ADD COLUMN IF NOT EXISTS ai_provider TEXT,
        ADD COLUMN IF NOT EXISTS duration INTEGER,
        ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
        ADD COLUMN IF NOT EXISTS transcription_mode TEXT DEFAULT 'hybrid',
        ADD COLUMN IF NOT EXISTS quality TEXT DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'realtime',
        ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
        ADD COLUMN IF NOT EXISTS processing_time INTEGER,
        ADD COLUMN IF NOT EXISTS medical_terms_detected TEXT[] DEFAULT '{}';
      `
    });

    if (voiceConvError) {
      console.error('❌ Error adding fields to voice_conversations:', voiceConvError);
    } else {
      console.log('✅ Added missing fields to voice_conversations');
    }

    // Migration 5: Add missing fields to voice_transcripts table
    console.log('📝 Migration 5: Adding missing fields to voice_transcripts...');
    const { error: voiceTranscriptError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE voice_transcripts 
        ADD COLUMN IF NOT EXISTS speaker_id TEXT,
        ADD COLUMN IF NOT EXISTS speaker_label TEXT,
        ADD COLUMN IF NOT EXISTS start_time INTEGER,
        ADD COLUMN IF NOT EXISTS end_time INTEGER,
        ADD COLUMN IF NOT EXISTS is_medical_term BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS medical_terms TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS segment_type TEXT DEFAULT 'speech';
      `
    });

    if (voiceTranscriptError) {
      console.error('❌ Error adding fields to voice_transcripts:', voiceTranscriptError);
    } else {
      console.log('✅ Added missing fields to voice_transcripts');
    }

    // Migration 6: Create voice_words table if it doesn't exist
    console.log('📝 Migration 6: Creating voice_words table...');
    const { error: voiceWordsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS voice_words (
          id SERIAL PRIMARY KEY,
          transcript_id INTEGER NOT NULL REFERENCES voice_transcripts(id) ON DELETE CASCADE,
          word TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          confidence DECIMAL(3,2),
          is_medical_term BOOLEAN DEFAULT FALSE,
          medical_term_category TEXT CHECK (medical_term_category IN ('condition', 'symptom', 'medication', 'procedure', 'measurement')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_voice_words_transcript_id ON voice_words(transcript_id);
        CREATE INDEX IF NOT EXISTS idx_voice_words_medical_terms ON voice_words(is_medical_term) WHERE is_medical_term = TRUE;
      `
    });

    if (voiceWordsError) {
      console.error('❌ Error creating voice_words table:', voiceWordsError);
    } else {
      console.log('✅ Created voice_words table');
    }

    // Migration 7: Add missing fields to chat_conversations table
    console.log('📝 Migration 7: Adding missing fields to chat_conversations...');
    const { error: chatConvError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE chat_conversations 
        ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'claude';
      `
    });

    if (chatConvError) {
      console.error('❌ Error adding ai_provider to chat_conversations:', chatConvError);
    } else {
      console.log('✅ Added ai_provider field to chat_conversations');
    }

    // Migration 8: Add missing fields to chat_messages table
    console.log('📝 Migration 8: Adding missing fields to chat_messages...');
    const { error: chatMsgError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE chat_messages 
        ADD COLUMN IF NOT EXISTS ai_provider TEXT,
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      `
    });

    if (chatMsgError) {
      console.error('❌ Error adding fields to chat_messages:', chatMsgError);
    } else {
      console.log('✅ Added missing fields to chat_messages');
    }

    // Migration 9: Add updated_at triggers for all tables
    console.log('📝 Migration 9: Adding updated_at triggers...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Add triggers to all tables that have updated_at
        DO $$
        DECLARE
          table_name text;
        BEGIN
          FOR table_name IN 
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN (
              'users', 'symptom_entries', 'differential_diagnoses', 
              'prescriptions', 'medical_history', 'notifications',
              'chat_conversations', 'chat_messages', 'voice_conversations', 
              'voice_transcripts', 'voice_words'
            )
          LOOP
            EXECUTE format('
              DROP TRIGGER IF EXISTS update_updated_at_%I ON %I;
              CREATE TRIGGER update_updated_at_%I
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            ', table_name, table_name, table_name, table_name);
          END LOOP;
        END $$;
      `
    });

    if (triggerError) {
      console.error('❌ Error adding updated_at triggers:', triggerError);
    } else {
      console.log('✅ Added updated_at triggers to all tables');
    }

    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('   ✅ Added treating_doctor to medical_history');
    console.log('   ✅ Added ai_provider to differential_diagnoses');
    console.log('   ✅ Added missing fields to notifications');
    console.log('   ✅ Added missing fields to voice_conversations');
    console.log('   ✅ Added missing fields to voice_transcripts');
    console.log('   ✅ Created voice_words table');
    console.log('   ✅ Added ai_provider to chat_conversations');
    console.log('   ✅ Added missing fields to chat_messages');
    console.log('   ✅ Added updated_at triggers to all tables');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('🏁 Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 