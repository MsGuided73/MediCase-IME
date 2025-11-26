-- Lab Integration Schema Extensions for Sherlock Health
-- Automated Laboratory Result Integration System

-- Lab Systems Registry
-- Stores configuration for connected laboratory systems
CREATE TABLE IF NOT EXISTS lab_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LABCORP', 'QUEST', 'EPIC', 'CERNER', 'ALLSCRIPTS', 'GENERIC')),
    base_url VARCHAR(500),
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('oauth2', 'mutual_tls', 'api_key', 'basic_auth')),
    
    -- Authentication credentials (encrypted)
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    api_key_hash VARCHAR(255), -- SHA-256 hash of API key
    certificate_fingerprint VARCHAR(255),
    
    -- Configuration
    fhir_version VARCHAR(10) DEFAULT 'R4',
    supported_resources TEXT[], -- Array of supported FHIR resources
    webhook_support BOOLEAN DEFAULT false,
    batch_processing BOOLEAN DEFAULT true,
    real_time_updates BOOLEAN DEFAULT false,
    
    -- Rate limiting
    requests_per_minute INTEGER DEFAULT 100,
    requests_per_hour INTEGER DEFAULT 1000,
    monthly_volume_limit INTEGER,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    certification_required BOOLEAN DEFAULT true,
    partnership_agreement BOOLEAN DEFAULT false,
    api_key_expiry TIMESTAMP WITH TIME ZONE,
    last_successful_connection TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Indexes
    UNIQUE(name),
    UNIQUE(api_key_hash),
    UNIQUE(certificate_fingerprint)
);

-- Lab Batch Processing Status
-- Tracks status of lab result batches received via webhooks
CREATE TABLE IF NOT EXISTS lab_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) NOT NULL UNIQUE,
    lab_system_id UUID REFERENCES lab_systems(id),
    
    -- Processing status
    status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'partial', 'failed')),
    total_results INTEGER DEFAULT 0,
    processed_results INTEGER DEFAULT 0,
    failed_results INTEGER DEFAULT 0,
    
    -- Timing
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    webhook_payload JSONB, -- Store original webhook payload for debugging
    processing_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical Value Alerts
-- Stores alerts for critical lab values requiring immediate attention
CREATE TABLE IF NOT EXISTS critical_value_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_report_id INTEGER REFERENCES lab_reports(id),
    patient_id INTEGER REFERENCES users(id),
    
    -- Alert details
    test_name VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    critical_range VARCHAR(100),
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    
    -- Notification tracking
    physician_notified BOOLEAN DEFAULT false,
    patient_notified BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    last_notification_attempt TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_critical_alerts_patient (patient_id),
    INDEX idx_critical_alerts_status (status),
    INDEX idx_critical_alerts_urgency (urgency),
    INDEX idx_critical_alerts_created (created_at)
);

-- Patient Lab Consents
-- Manages patient consent for automated lab data sharing
CREATE TABLE IF NOT EXISTS patient_lab_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id INTEGER REFERENCES users(id),
    lab_system_id UUID REFERENCES lab_systems(id),
    
    -- Consent details
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('full', 'limited', 'emergency_only')),
    is_active BOOLEAN DEFAULT true,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Scope of consent
    allowed_test_types TEXT[], -- Array of allowed test types
    allowed_systems TEXT[], -- Array of allowed lab system IDs
    data_sharing_level VARCHAR(50) DEFAULT 'standard' CHECK (data_sharing_level IN ('minimal', 'standard', 'comprehensive')),
    
    -- Consent management
    consent_method VARCHAR(50) CHECK (consent_method IN ('electronic', 'written', 'verbal', 'implied')),
    consent_document_url VARCHAR(500),
    witness_id UUID REFERENCES users(id),
    
    -- Revocation
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(patient_id, lab_system_id),
    
    -- Indexes
    INDEX idx_patient_consents_patient (patient_id),
    INDEX idx_patient_consents_active (is_active),
    INDEX idx_patient_consents_expiry (expiry_date)
);

-- User External Identifiers
-- Maps external system identifiers (MRN, SSN, etc.) to internal user IDs
CREATE TABLE IF NOT EXISTS user_external_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    
    -- External identifier details
    external_id VARCHAR(255) NOT NULL,
    system VARCHAR(255) NOT NULL, -- System that issued the ID (e.g., hospital MRN system)
    id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('MRN', 'SSN', 'PATIENT_ID', 'INSURANCE_ID', 'CUSTOM')),
    
    -- Validation and status
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    issuing_organization VARCHAR(255),
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(external_id, system),
    
    -- Indexes
    INDEX idx_external_ids_user (user_id),
    INDEX idx_external_ids_external (external_id),
    INDEX idx_external_ids_system (system),
    INDEX idx_external_ids_type (id_type)
);

-- Patient-Physician Relationships
-- Manages relationships between patients and their healthcare providers
CREATE TABLE IF NOT EXISTS patient_physicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id INTEGER REFERENCES users(id),
    physician_id INTEGER REFERENCES users(id), -- Assuming physicians are also users
    
    -- Relationship details
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('primary', 'specialist', 'consulting', 'emergency')),
    specialty VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Contact preferences
    notification_preferences JSONB DEFAULT '{"critical_values": true, "all_results": false, "method": "email"}',
    
    -- Relationship period
    relationship_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relationship_end TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(patient_id, physician_id, relationship_type),
    
    -- Indexes
    INDEX idx_patient_physicians_patient (patient_id),
    INDEX idx_patient_physicians_physician (physician_id),
    INDEX idx_patient_physicians_active (is_active),
    INDEX idx_patient_physicians_primary (is_primary)
);

-- Extend existing lab_reports table with integration fields
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS external_system VARCHAR(100);
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS batch_id VARCHAR(255);
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS fhir_bundle JSONB; -- Store original FHIR data

-- Add indexes for new lab_reports columns
CREATE INDEX IF NOT EXISTS idx_lab_reports_external_id ON lab_reports(external_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_external_system ON lab_reports(external_system);
CREATE INDEX IF NOT EXISTS idx_lab_reports_batch_id ON lab_reports(batch_id);

-- Extend existing lab_values table with FHIR fields
ALTER TABLE lab_values ADD COLUMN IF NOT EXISTS loinc_code VARCHAR(20);
ALTER TABLE lab_values ADD COLUMN IF NOT EXISTS snomed_code VARCHAR(20);
ALTER TABLE lab_values ADD COLUMN IF NOT EXISTS fhir_observation JSONB; -- Store original FHIR observation

-- Add indexes for new lab_values columns
CREATE INDEX IF NOT EXISTS idx_lab_values_loinc ON lab_values(loinc_code);
CREATE INDEX IF NOT EXISTS idx_lab_values_snomed ON lab_values(snomed_code);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_lab_systems_updated_at BEFORE UPDATE ON lab_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_batches_updated_at BEFORE UPDATE ON lab_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_critical_value_alerts_updated_at BEFORE UPDATE ON critical_value_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_lab_consents_updated_at BEFORE UPDATE ON patient_lab_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_external_ids_updated_at BEFORE UPDATE ON user_external_ids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_physicians_updated_at BEFORE UPDATE ON patient_physicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for HIPAA compliance
ALTER TABLE lab_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_value_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_lab_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_external_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_physicians ENABLE ROW LEVEL SECURITY;

-- RLS policies (basic examples - would need more sophisticated policies in production)
CREATE POLICY "Users can view their own lab consents" ON patient_lab_consents FOR SELECT USING (patient_id = auth.uid()::integer);
CREATE POLICY "Users can view their own external IDs" ON user_external_ids FOR SELECT USING (user_id = auth.uid()::integer);
CREATE POLICY "Patients can view their own critical alerts" ON critical_value_alerts FOR SELECT USING (patient_id = auth.uid()::integer);
CREATE POLICY "Patients can view their physician relationships" ON patient_physicians FOR SELECT USING (patient_id = auth.uid()::integer);

-- Insert sample lab systems for testing
INSERT INTO lab_systems (name, type, auth_type, base_url, fhir_version, supported_resources, webhook_support, batch_processing, real_time_updates) VALUES
('LabCorp Integration', 'LABCORP', 'oauth2', 'https://api.labcorp.com/fhir/R4', 'R4', ARRAY['Patient', 'DiagnosticReport', 'Observation'], true, true, true),
('Quest Diagnostics', 'QUEST', 'oauth2', 'https://api.questdiagnostics.com/fhir/R4', 'R4', ARRAY['Patient', 'DiagnosticReport', 'Observation'], true, true, true),
('Epic MyChart', 'EPIC', 'oauth2', 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4', 'R4', ARRAY['Patient', 'DiagnosticReport', 'Observation', 'Condition'], false, true, false)
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE lab_systems IS 'Registry of connected laboratory systems and their configurations';
COMMENT ON TABLE lab_batches IS 'Tracking table for lab result batch processing status';
COMMENT ON TABLE critical_value_alerts IS 'Alerts for critical lab values requiring immediate attention';
COMMENT ON TABLE patient_lab_consents IS 'Patient consent management for automated lab data sharing';
COMMENT ON TABLE user_external_ids IS 'Mapping between external system identifiers and internal user IDs';
COMMENT ON TABLE patient_physicians IS 'Relationships between patients and their healthcare providers';
