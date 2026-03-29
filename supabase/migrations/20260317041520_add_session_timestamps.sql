-- Add session tracking timestamps to mission_completions
ALTER TABLE mission_completions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Update the handle_failed_mission_gauntlet trigger or related logic if needed,
-- but the main requirement is just that these columns exist to track time.
