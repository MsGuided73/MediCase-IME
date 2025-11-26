-- Role-Based Access Control Migration
-- Adds user roles and permissions system to Patient HQ

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';

-- Create user roles enum constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('patient', 'physician', 'corporate_admin', 'admin');
    END IF;
END $$;

-- Update role column with proper enum constraint
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Create user permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    permission_value JSONB DEFAULT '{}',
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission_key)
);

-- Create role permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    permission_key TEXT NOT NULL,
    permission_value JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_key)
);

-- Create patient-physician relationships table
CREATE TABLE IF NOT EXISTS patient_physician_relationships (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    physician_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'primary_care', 'specialist', 'consultant'
    is_active BOOLEAN DEFAULT TRUE,
    established_date TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id, physician_id, relationship_type)
);

-- Create organization membership table
CREATE TABLE IF NOT EXISTS organization_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    membership_type TEXT NOT NULL, -- 'employee', 'contractor', 'dependent'
    is_active BOOLEAN DEFAULT TRUE,
    joined_date TIMESTAMP DEFAULT NOW(),
    termination_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, permission_key, permission_value) VALUES
-- Patient permissions
('patient', 'canAccessPatientDashboard', '{"level": "full"}'),
('patient', 'canViewOwnHealthData', '{"level": "full"}'),
('patient', 'canEditOwnProfile', '{"level": "full"}'),
('patient', 'canUploadLabResults', '{"level": "full"}'),
('patient', 'canTrackSymptoms', '{"level": "full"}'),
('patient', 'canManageMedications', '{"level": "full"}'),
('patient', 'canMessageProviders', '{"level": "full"}'),
('patient', 'canScheduleAppointments', '{"level": "full"}'),
('patient', 'canExportOwnData', '{"level": "full"}'),
('patient', 'canShareDataWithProviders', '{"level": "full"}'),

-- Physician permissions
('physician', 'canAccessMedicalDashboard', '{"level": "full"}'),
('physician', 'canViewPatientHealthData', '{"level": "full", "requiresRelationship": true}'),
('physician', 'canEditPatientRecords', '{"level": "full", "requiresRelationship": true}'),
('physician', 'canOrderLabTests', '{"level": "full"}'),
('physician', 'canPrescribeMedications', '{"level": "full"}'),
('physician', 'canUseTranscriptionTools', '{"level": "full"}'),
('physician', 'canGenerateSOAPNotes', '{"level": "full"}'),
('physician', 'canAccessMedicalCoding', '{"level": "full"}'),
('physician', 'canSubmitInsuranceClaims', '{"level": "full"}'),
('physician', 'canMessagePatients', '{"level": "full"}'),
('physician', 'canManageOwnSchedule', '{"level": "full"}'),
('physician', 'canAccessPracticeAnalytics', '{"level": "full"}'),
('physician', 'canExportPatientData', '{"level": "full", "requiresAuthorization": true}'),

-- Corporate Admin permissions
('corporate_admin', 'canManageOrganization', '{"level": "full"}'),
('corporate_admin', 'canManageEmployees', '{"level": "full"}'),
('corporate_admin', 'canAccessPopulationHealth', '{"level": "full"}'),
('corporate_admin', 'canConfigureWellnessPrograms', '{"level": "full"}'),
('corporate_admin', 'canAccessAdvancedAnalytics', '{"level": "full"}'),
('corporate_admin', 'canGenerateComplianceReports', '{"level": "full"}'),
('corporate_admin', 'canAccessROIAnalytics', '{"level": "full"}'),
('corporate_admin', 'canExportOrganizationalData', '{"level": "full"}'),
('corporate_admin', 'canManageUserRoles', '{"level": "full"}'),
('corporate_admin', 'canConfigureSystemSettings', '{"level": "full"}'),
('corporate_admin', 'canAccessAuditLogs', '{"level": "full"}'),
('corporate_admin', 'canManageIntegrations', '{"level": "full"}'),
('corporate_admin', 'canAccessEmployeeHealthData', '{"level": "full"}'),
('corporate_admin', 'canViewAggregateHealthMetrics', '{"level": "full"}'),
('corporate_admin', 'canAccessWellnessInitiatives', '{"level": "full"}');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(role, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_physician_patient ON patient_physician_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_physician_physician ON patient_physician_relationships(physician_id);
CREATE INDEX IF NOT EXISTS idx_patient_physician_active ON patient_physician_relationships(patient_id, physician_id, is_active);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_active ON organization_memberships(organization_id, is_active);

-- Create Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_physician_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- Users can only access their own record
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
    FOR ALL USING (auth.uid()::text = id::text);

-- Users can view their own permissions
DROP POLICY IF EXISTS user_permissions_self_access ON user_permissions;
CREATE POLICY user_permissions_self_access ON user_permissions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Everyone can view active role permissions
DROP POLICY IF EXISTS role_permissions_view ON role_permissions;
CREATE POLICY role_permissions_view ON role_permissions
    FOR SELECT USING (is_active = true);

-- Physicians can view their patient relationships
DROP POLICY IF EXISTS patient_physician_relationships_physician_access ON patient_physician_relationships;
CREATE POLICY patient_physician_relationships_physician_access ON patient_physician_relationships
    FOR SELECT USING (auth.uid()::text = physician_id::text);

-- Patients can view their physician relationships
DROP POLICY IF EXISTS patient_physician_relationships_patient_access ON patient_physician_relationships;
CREATE POLICY patient_physician_relationships_patient_access ON patient_physician_relationships
    FOR SELECT USING (auth.uid()::text = patient_id::text);

-- Corporate admins can manage their organization memberships
DROP POLICY IF EXISTS organization_memberships_admin_access ON organization_memberships;
CREATE POLICY organization_memberships_admin_access ON organization_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::integer
            AND users.role = 'corporate_admin'
        )
    );

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    user_role user_role;
    permissions JSONB := '{}';
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    -- Get role-based permissions
    SELECT jsonb_object_agg(permission_key, permission_value)
    INTO permissions
    FROM role_permissions
    WHERE role = user_role AND is_active = true;

    -- Override with user-specific permissions
    SELECT jsonb_object_agg(permission_key, permission_value)
    INTO permissions
    FROM (
        SELECT permission_key, permission_value FROM role_permissions WHERE role = user_role AND is_active = true
        UNION ALL
        SELECT permission_key, permission_value FROM user_permissions WHERE user_id = p_user_id AND is_active = true
    ) combined_permissions
    GROUP BY permission_key
    HAVING jsonb_typeof(value) = 'object';

    RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_permission_key TEXT,
    p_resource_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
    has_permission BOOLEAN := false;
    resource_permission BOOLEAN := true;
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    -- Check role-based permissions
    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role = user_role
        AND permission_key = p_permission_key
        AND is_active = true
    ) INTO has_permission;

    -- If permission requires resource-specific check
    IF has_permission AND p_resource_id IS NOT NULL THEN
        -- Check if user has relationship with the resource (e.g., patient-physician relationship)
        IF p_permission_key IN ('canViewPatientHealthData', 'canEditPatientRecords', 'canAccessAssignedPatients') THEN
            SELECT EXISTS(
                SELECT 1 FROM patient_physician_relationships
                WHERE physician_id = p_user_id
                AND patient_id = p_resource_id::INTEGER
                AND is_active = true
            ) INTO resource_permission;
        END IF;
    END IF;

    RETURN has_permission AND resource_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user to physician
CREATE OR REPLACE FUNCTION assign_patient_to_physician(
    p_patient_id INTEGER,
    p_physician_id INTEGER,
    p_relationship_type TEXT DEFAULT 'primary_care'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if both users exist and have correct roles
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_patient_id AND role = 'patient') THEN
        RETURN FALSE;
    END IF;

    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_physician_id AND role = 'physician') THEN
        RETURN FALSE;
    END IF;

    -- Insert or update relationship
    INSERT INTO patient_physician_relationships (patient_id, physician_id, relationship_type)
    VALUES (p_patient_id, p_physician_id, p_relationship_type)
    ON CONFLICT (patient_id, physician_id, relationship_type)
    DO UPDATE SET is_active = true, updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add user to organization
CREATE OR REPLACE FUNCTION add_user_to_organization(
    p_user_id INTEGER,
    p_organization_name TEXT,
    p_organization_id TEXT,
    p_membership_type TEXT DEFAULT 'employee'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) THEN
        RETURN FALSE;
    END IF;

    -- Insert or update organization membership
    INSERT INTO organization_memberships (user_id, organization_name, organization_id, membership_type)
    VALUES (p_user_id, p_organization_name, p_organization_id, p_membership_type)
    ON CONFLICT (user_id, organization_id)
    DO UPDATE SET
        is_active = true,
        membership_type = p_membership_type,
        termination_date = NULL,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for access tracking
CREATE TABLE IF NOT EXISTS access_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'login', 'logout'
    resource_type TEXT NOT NULL, -- 'patient_data', 'medical_record', 'lab_result', etc.
    resource_id TEXT, -- ID of the resource accessed
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for audit log performance
CREATE INDEX IF NOT EXISTS idx_access_audit_log_user ON access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_resource ON access_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_timestamp ON access_audit_log(created_at);

-- Function to log access attempts
CREATE OR REPLACE FUNCTION log_access_attempt(
    p_user_id INTEGER,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_additional_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO access_audit_log (
        user_id, action, resource_type, resource_id,
        ip_address, user_agent, success, error_message, additional_data
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        inet_client_addr(), user_agent(), p_success, p_error_message, p_additional_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have proper roles (if they don't already)
-- This is a safe operation that won't affect existing role assignments
UPDATE users SET role = 'patient' WHERE role IS NULL OR role = '';

-- Create some test data for development
DO $$
DECLARE
    test_patient_id INTEGER;
    test_physician_id INTEGER;
BEGIN
    -- Create test patient if it doesn't exist
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES ('patient.test@patienthq.com', '$2b$10$test.hash.for.development.only', 'Test', 'Patient', 'patient')
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO test_patient_id;

    -- Create test physician if it doesn't exist
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES ('physician.test@patienthq.com', '$2b$10$test.hash.for.development.only', 'Test', 'Physician', 'physician')
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO test_physician_id;

    -- Create relationship between test patient and physician
    IF test_patient_id IS NOT NULL AND test_physician_id IS NOT NULL THEN
        PERFORM assign_patient_to_physician(test_patient_id, test_physician_id, 'primary_care');
    END IF;
END $$;

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION get_user_permissions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_patient_to_physician(INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_organization(INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB) TO authenticated;

-- Enable RLS on audit log for security
ALTER TABLE access_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS access_audit_log_admin_access ON access_audit_log;
CREATE POLICY access_audit_log_admin_access ON access_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::integer
            AND users.role IN ('corporate_admin', 'admin')
        )
    );

-- Users can view their own audit logs
DROP POLICY IF EXISTS access_audit_log_self_access ON access_audit_log;
CREATE POLICY access_audit_log_self_access ON access_audit_log
    FOR SELECT USING (auth.uid()::integer = user_id);

-- Everyone can insert audit logs (for logging access attempts)
DROP POLICY IF EXISTS access_audit_log_insert ON access_audit_log;
CREATE POLICY access_audit_log_insert ON access_audit_log
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE users IS 'Patient HQ users with role-based access control';
COMMENT ON TABLE user_permissions IS 'User-specific permission overrides';
COMMENT ON TABLE role_permissions IS 'Default permissions for each user role';
COMMENT ON TABLE patient_physician_relationships IS 'Patient-physician care relationships';
COMMENT ON TABLE organization_memberships IS 'User membership in corporate organizations';
COMMENT ON TABLE access_audit_log IS 'Audit trail for access control and security monitoring';

COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user (role-based + user-specific)';
COMMENT ON FUNCTION user_has_permission IS 'Check if user has specific permission for resource';
COMMENT ON FUNCTION assign_patient_to_physician IS 'Establish care relationship between patient and physician';
COMMENT ON FUNCTION add_user_to_organization IS 'Add user to corporate organization';
COMMENT ON FUNCTION log_access_attempt IS 'Log access attempts for audit trail';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Role-Based Access Control system successfully initialized!';
    RAISE NOTICE 'Available user roles: patient, physician, corporate_admin, admin';
    RAISE NOTICE 'Default permissions configured for all roles';
    RAISE NOTICE 'Test users created: patient.test@patienthq.com, physician.test@patienthq.com';
END $$;
