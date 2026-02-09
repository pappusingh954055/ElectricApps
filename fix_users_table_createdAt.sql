-- Fix CreatedAt and ModifiedAt columns to allow NULL or have default values
-- This script will alter the Users table to make CreatedAt nullable or add a default constraint

-- Option 1: Make CreatedAt nullable (recommended if you want to keep existing data)
ALTER TABLE dbo.Users
ALTER COLUMN CreatedAt datetime2(7) NULL;

-- Option 2: Add default constraint for CreatedAt (if you want to keep NOT NULL)
-- First, update existing records that might have NULL values
UPDATE dbo.Users
SET CreatedAt = GETUTCDATE()
WHERE CreatedAt IS NULL;

-- Then add the default constraint
ALTER TABLE dbo.Users
ADD CONSTRAINT DF_Users_CreatedAt DEFAULT (GETUTCDATE()) FOR CreatedAt;

-- Make sure ModifiedAt is nullable (it should be optional)
ALTER TABLE dbo.Users
ALTER COLUMN ModifiedAt datetime2(7) NULL;
