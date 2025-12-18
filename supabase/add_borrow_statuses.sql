-- Add 'pending' and 'rejected' statuses to borrow_status enum
-- Run this in Supabase SQL Editor

-- Step 1: Add new values to the enum
ALTER TYPE borrow_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE borrow_status ADD VALUE IF NOT EXISTS 'rejected';

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'borrow_status'::regtype 
ORDER BY enumsortorder;
