# 🗄️ Patient HQ - Database Schema Modification Plan
## Extending Sherlock Health Schema for Dual-User Functionality

---

## 📊 **Current Schema Analysis**

### **Existing Schema Strengths**
- **30+ Tables**: Comprehensive medical data model (1,396 lines of schema)
- **HIPAA Compliant**: Row Level Security (RLS) enabled on all user data tables
- **Real-time Capable**: Supabase subscriptions for live updates
- **Type Safe**: Complete TypeScript types with Drizzle ORM
- **Scalable**: Designed for enterprise-scale deployment

### **Current Table Categories**
```
Core Tables (7):
├── users, medical_history, symptom_sets, symptom_entries
├── differential_diagnoses, prescriptions, notifications

Communication (4):
├── chat_conversations, chat_messages
├── voice_conversations, voice_transcripts, voice_words

Lab Integration (6):
├── lab_reports, lab_values, lab_analyses
├── lab_reference_ranges, genetic_variants, pgx_analyses

Wearable Integration (4):
├── wearable_devices, wearable_metrics
├── wearable_sessions, wearable_alerts

Mental Health (3):
├── mental_health_assessments, journal_entries
├── therapeutic_sessions

AI & Memory (6):
├── agent_memory, conversation_memory, memory_associations
├── user_preferences, health_patterns
```

---

## 🎯 **Required Schema Extensions for Patient HQ**

### **1. ROLE-BASED ACCESS CONTROL TABLES**

#### **Organizations Table**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'corporate', 'individual')),
  
  -- Contact Information
  address JSONB DEFAULT '{}', -- {street, city, state, zip, country}
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Configuration
  settings JSONB DEFAULT '{}', -- Organization-specific settings
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  max_users INTEGER DEFAULT 100,
  max_patients INTEGER DEFAULT 1000,
  
  -- Features
  features_enabled JSONB DEFAULT '{}', -- {lab_integration, voice_notes, ai_analysis, etc.}
  branding JSONB DEFAULT '{}', -- {logo_url, primary_color, secondary_color}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

#### **User Roles Table**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role Definition
  role TEXT NOT NULL CHECK (role IN ('patient', 'physician', 'nurse', 'admin', 'corporate_admin')),
  specialty TEXT, -- For physicians: 'cardiology', 'dermatology', etc.
  license_number TEXT, -- Professional license number
  
  -- Permissions
  permissions JSONB DEFAULT '{}', -- Granular permissions object
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Primary role for multi-role users
  
  -- Audit
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(id)
);
```

#### **Patient-Physician Relationships Table**
```sql
CREATE TABLE patient_physician_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  physician_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Relationship Details
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('primary', 'specialist', 'consulting', 'emergency')),
  specialty TEXT, -- Physician specialty for this relationship
  
  -- Access Permissions
  permissions JSONB DEFAULT '{
    "view_lab_results": true,
    "view_symptoms": true,
    "view_mental_health": false,
    "prescribe_medications": true,
    "access_voice_notes": false,
    "view_wearable_data": true
  }',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  relationship_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relationship_end TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. CONSULTATION MANAGEMENT TABLES**

#### **Consultations Table**
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER NOT NULL REFERENCES users(id),
  physician_id INTEGER NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Consultation Details
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('telephonic', 'in_person', 'video', 'follow_up')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Documentation
  chief_complaint TEXT,
  history_present_illness TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  
  -- Clinical Data
  vital_signs JSONB DEFAULT '{}', -- {bp_systolic, bp_diastolic, heart_rate, temperature, etc.}
  physical_exam JSONB DEFAULT '{}', -- Structured physical examination findings
  
  -- Voice Recording
  voice_recording_url TEXT,
  voice_transcript_id INTEGER REFERENCES voice_transcripts(id),
  
  -- Billing
  cpt_codes TEXT[], -- Array of CPT codes for billing
  icd_codes TEXT[], -- Array of ICD-10 codes
  billing_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Clinical Templates Table**
```sql
CREATE TABLE clinical_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Template Details
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('consultation', 'physical_exam', 'assessment', 'plan')),
  specialty TEXT, -- Applicable specialty
  
  -- Template Structure
  template_data JSONB NOT NULL, -- Structured template with fields and options
  
  -- Usage
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. ENTERPRISE FEATURES TABLES**

#### **Enterprise Settings Table**
```sql
CREATE TABLE enterprise_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- SSO Configuration
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider TEXT, -- 'saml', 'active_directory', 'okta', etc.
  sso_config JSONB DEFAULT '{}', -- Provider-specific configuration
  
  -- Integration Settings
  ehr_integrations JSONB DEFAULT '{}', -- EHR system configurations
  lab_integrations JSONB DEFAULT '{}', -- Lab network configurations
  
  -- Compliance Settings
  audit_retention_days INTEGER DEFAULT 2555, -- 7 years default
  data_retention_policy JSONB DEFAULT '{}',
  compliance_requirements TEXT[], -- ['HIPAA', 'SOX', 'GDPR', etc.]
  
  -- Notification Settings
  notification_preferences JSONB DEFAULT '{}',
  alert_escalation_rules JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
```

#### **Audit Logs Table (Enhanced)**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'login', 'data_access', 'data_modification', etc.
  resource_type TEXT, -- 'patient_data', 'lab_results', 'prescriptions', etc.
  resource_id TEXT, -- ID of the accessed/modified resource
  
  -- Action Details
  action TEXT NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  details JSONB DEFAULT '{}', -- Additional event details
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Compliance
  phi_accessed BOOLEAN DEFAULT false, -- Protected Health Information accessed
  consent_verified BOOLEAN DEFAULT false,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 **Existing Table Modifications**

### **Users Table Extensions**
```sql
-- Add columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
```

### **Symptom Entries Extensions**
```sql
-- Add consultation tracking to symptom entries
ALTER TABLE symptom_entries ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id);
ALTER TABLE symptom_entries ADD COLUMN IF NOT EXISTS documented_by INTEGER REFERENCES users(id);
ALTER TABLE symptom_entries ADD COLUMN IF NOT EXISTS documentation_type TEXT DEFAULT 'patient_reported' 
  CHECK (documentation_type IN ('patient_reported', 'physician_documented', 'nurse_documented'));
```

### **Lab Reports Extensions**
```sql
-- Add physician tracking to lab reports
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS ordering_physician_id INTEGER REFERENCES users(id);
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS reviewing_physician_id INTEGER REFERENCES users(id);
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS physician_notes TEXT;
```

### **Prescriptions Extensions**
```sql
-- Add prescribing physician tracking
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescribed_by_physician_id INTEGER REFERENCES users(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pharmacy_info JSONB DEFAULT '{}';
```

---

## 🔐 **Row Level Security (RLS) Updates**

### **Organization-Based Data Isolation**
```sql
-- Organizations RLS
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid()::integer AND is_active = true
    )
  );

-- User Roles RLS
CREATE POLICY "Users can view roles in their organization" ON user_roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid()::integer AND is_active = true
    )
  );

-- Patient-Physician Relationships RLS
CREATE POLICY "Patients can view their physicians" ON patient_physician_relationships
  FOR SELECT USING (patient_id = auth.uid()::integer);

CREATE POLICY "Physicians can view their patients" ON patient_physician_relationships
  FOR SELECT USING (physician_id = auth.uid()::integer);
```

### **Role-Based Access Policies**
```sql
-- Consultations RLS
CREATE POLICY "Patients can view their consultations" ON consultations
  FOR SELECT USING (patient_id = auth.uid()::integer);

CREATE POLICY "Physicians can view their consultations" ON consultations
  FOR SELECT USING (physician_id = auth.uid()::integer);

-- Enhanced symptom entries policy
CREATE POLICY "Physicians can view patient symptoms with permission" ON symptom_entries
  FOR SELECT USING (
    user_id IN (
      SELECT patient_id FROM patient_physician_relationships 
      WHERE physician_id = auth.uid()::integer 
      AND is_active = true 
      AND (permissions->>'view_symptoms')::boolean = true
    )
  );
```

---

## 📋 **Migration Strategy**

### **Phase 1: Schema Extension (Week 1)**
1. **Create New Tables**: Add all new tables without breaking existing functionality
2. **Extend Existing Tables**: Add new columns with default values
3. **Create Indexes**: Add performance indexes for new columns
4. **Update RLS Policies**: Extend existing policies for new tables

### **Phase 2: Data Migration (Week 1-2)**
1. **Default Organization**: Create default organization for existing users
2. **Default Roles**: Assign 'patient' role to all existing users
3. **Relationship Mapping**: Create patient-physician relationships where applicable
4. **Data Validation**: Ensure all existing data remains accessible

### **Phase 3: Application Updates (Week 2-6)**
1. **API Updates**: Extend existing endpoints for role-based access
2. **Frontend Updates**: Update components for multi-tenant support
3. **Testing**: Comprehensive testing of role-based functionality
4. **Documentation**: Update API documentation and user guides

---

## 🎯 **Performance Considerations**

### **Indexing Strategy**
```sql
-- Performance indexes for new tables
CREATE INDEX idx_user_roles_user_org ON user_roles(user_id, organization_id);
CREATE INDEX idx_patient_physician_active ON patient_physician_relationships(patient_id, physician_id) WHERE is_active = true;
CREATE INDEX idx_consultations_patient_date ON consultations(patient_id, scheduled_at);
CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, created_at);

-- Composite indexes for common queries
CREATE INDEX idx_users_org_role ON users(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_symptom_entries_consultation ON symptom_entries(consultation_id) WHERE consultation_id IS NOT NULL;
```

### **Query Optimization**
- **Materialized Views**: For complex organization-level analytics
- **Partitioning**: Consider partitioning audit_logs by date for large enterprises
- **Connection Pooling**: Ensure proper connection management for multi-tenant queries

---

## ✅ **Validation & Testing Plan**

### **Data Integrity Tests**
- [ ] All existing user data remains accessible
- [ ] RLS policies prevent unauthorized access
- [ ] Foreign key constraints maintain referential integrity
- [ ] Default values populate correctly for new columns

### **Performance Tests**
- [ ] Query performance maintained for existing functionality
- [ ] New role-based queries perform within acceptable limits
- [ ] Database can handle 400,000+ users with new schema
- [ ] Index usage optimized for common query patterns

### **Security Tests**
- [ ] Multi-tenant data isolation verified
- [ ] Role-based access control working correctly
- [ ] Audit logging captures all required events
- [ ] No data leakage between organizations

---

**Next Action**: Begin Phase 1 schema extension with careful testing in development environment before production deployment.
