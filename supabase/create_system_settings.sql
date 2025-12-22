-- Create system_settings table for storing application-wide settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Insert default fine rate
INSERT INTO system_settings (key, value) 
VALUES ('fine_rate_per_day', '{"amount": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read system settings"
    ON system_settings
    FOR SELECT
    USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update system settings"
    ON system_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Only admins can insert settings
CREATE POLICY "Only admins can insert system settings"
    ON system_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
