-- Streak Tracking Table
-- This table tracks continuous activity streaks for users

CREATE TABLE streak_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL CHECK (streak_type IN ('situation_log', 'self_care', 'mood_log', 'app_usage', 'any_activity')),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    activity_days INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Stores day numbers (0-6 for Sun-Sat) of active days in current week
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Index for streak lookups
CREATE INDEX idx_streaks_user ON streak_tracking(user_id);

-- Trigger to update the timestamp when a streak is updated
CREATE TRIGGER update_streak_tracking_modtime
BEFORE UPDATE ON streak_tracking
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Sample data
INSERT INTO streak_tracking (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date, activity_days)
VALUES 
    ((SELECT id FROM users LIMIT 1), 'self_care', 5, 7, CURRENT_DATE, CURRENT_DATE - INTERVAL '5 days', ARRAY[1,2,3,4,5]); 