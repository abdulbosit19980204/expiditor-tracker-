-- Add status column to TaskRun table
-- This script manually applies the migration if python manage.py migrate fails

BEGIN;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expeditor_app_taskrun' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE expeditor_app_taskrun 
        ADD COLUMN status VARCHAR(20) DEFAULT 'running' NOT NULL;
        
        -- Add check constraint for status values
        ALTER TABLE expeditor_app_taskrun 
        ADD CONSTRAINT expeditor_app_taskrun_status_check 
        CHECK (status IN ('running', 'completed', 'failed', 'cancelled'));
        
        -- Create index on status and started_at
        CREATE INDEX expeditor_a_status_idx 
        ON expeditor_app_taskrun (status, started_at);
        
        RAISE NOTICE 'Status column added successfully';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $$;

-- Update existing records: set status based on is_running and finished_at
UPDATE expeditor_app_taskrun
SET status = CASE
    WHEN is_running = TRUE THEN 'running'
    WHEN is_running = FALSE AND finished_at IS NOT NULL THEN 'completed'
    ELSE 'running'
END;

-- Insert migration record if not exists
INSERT INTO django_migrations (app, name, applied)
SELECT 'expeditor_app', '0010_add_status_to_taskrun', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'expeditor_app' AND name = '0010_add_status_to_taskrun'
);

COMMIT;

SELECT 'Migration applied successfully!' AS result;




