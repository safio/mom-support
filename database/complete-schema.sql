-- Mom Support App Complete Database Schema
-- This schema includes:
-- 1. Core tables for users, profiles, and authentication
-- 2. Situation tracking functionality
-- 3. Guidance content and recommendations
-- 4. Self-care tracking and mood logging
-- 5. Progress tracking and insights
-- 6. App usage metrics
-- 7. Subscription management
-- 8. Various indexes, triggers, and utility functions

------------------------
-- CLEAN DATABASE FIRST
------------------------

-- First, disable triggers to avoid trigger errors during drops
SET session_replication_role = 'replica';

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_subscription_transactions_user;
DROP INDEX IF EXISTS idx_feature_access_log_user;
DROP INDEX IF EXISTS idx_promo_code_redemptions_user;
DROP INDEX IF EXISTS idx_feature_usage_counts_user;
DROP INDEX IF EXISTS idx_mood_entries_date;
DROP INDEX IF EXISTS idx_self_care_logs_date;
DROP INDEX IF EXISTS idx_feature_usage_date;
DROP INDEX IF EXISTS idx_situations_date;
DROP INDEX IF EXISTS idx_situations_category;
DROP INDEX IF EXISTS idx_guidance_recommendations_user;

-- Usage tracking tables
DROP TABLE IF EXISTS feature_usage_counts CASCADE;
DROP TABLE IF EXISTS feature_usage_limits CASCADE;

-- Promo code tables 
DROP TABLE IF EXISTS promo_code_redemptions CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;

-- Feature access tables
DROP TABLE IF EXISTS feature_access_log CASCADE;

-- Transaction tables
DROP TABLE IF EXISTS subscription_transactions CASCADE;

-- Subscription tables
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_features CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- App usage tables
DROP TABLE IF EXISTS app_sessions CASCADE;
DROP TABLE IF EXISTS feature_usage CASCADE;

-- Progress tracking tables
DROP TABLE IF EXISTS progress_goals CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS progress_summaries CASCADE;
DROP TABLE IF EXISTS streak_tracking CASCADE;

-- Self-care tables
DROP TABLE IF EXISTS self_care_reminders CASCADE;
DROP TABLE IF EXISTS self_care_logs CASCADE;
DROP TABLE IF EXISTS self_care_activities CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;

-- Guidance tables
DROP TABLE IF EXISTS guidance_recommendations CASCADE;
DROP TABLE IF EXISTS guidance_resource_interactions CASCADE;
DROP TABLE IF EXISTS guidance_resources CASCADE;
DROP TABLE IF EXISTS guidance_categories CASCADE;

-- Situation tracking tables
DROP TABLE IF EXISTS situations CASCADE;
DROP TABLE IF EXISTS situation_categories CASCADE;

-- User tables
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS update_subscription_modified_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_session_duration() CASCADE;
DROP FUNCTION IF EXISTS check_feature_access(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS increment_feature_usage(UUID, VARCHAR) CASCADE;

-- Reset triggers
SET session_replication_role = 'origin';

-- Enable UUID extension for anonymous user IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------
-- USERS & PROFILES
------------------------

-- Table for all users (both anonymous and registered)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE, -- Null for anonymous users
    password_hash VARCHAR(255), -- Null for anonymous users
    full_name VARCHAR(255),
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'deleted'))
);

-- User profiles with additional information
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    children_ages TEXT[], -- Array of child ages
    preferred_language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    theme_preference VARCHAR(20) DEFAULT 'light',
    has_viewed_onboarding BOOLEAN DEFAULT FALSE,
    preferences JSONB, -- Flexible JSON field for additional preferences
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication tokens for password reset, email verification, etc.
CREATE TABLE auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('reset_password', 'email_verification')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);

------------------------
-- SITUATION TRACKING
------------------------

-- Categories for parenting situations
CREATE TABLE situation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7), -- HEX color code
    icon_name VARCHAR(50), -- FontAwesome icon name
    is_active BOOLEAN DEFAULT TRUE
);

-- Initial data for situation categories
INSERT INTO situation_categories (name, description, color_code, icon_name) VALUES
('behavior', 'Behavioral challenges and discipline situations', '#E57373', 'child'),
('sleep', 'Sleep-related situations and routines', '#64B5F6', 'moon-o'),
('eating', 'Mealtime challenges and nutrition', '#FFB74D', 'cutlery'),
('positive', 'Positive moments and milestones', '#81C784', 'smile-o'),
('development', 'Developmental concerns or questions', '#BA68C8', 'line-chart'),
('other', 'Other parenting situations', '#90A4AE', 'ellipsis-h');

-- Logged parenting situations
CREATE TABLE situations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES situation_categories(id),
    situation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    situation_time TIME,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    mood VARCHAR(50), -- User's mood during the situation
    resolution_notes TEXT, -- How the situation was resolved
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient date-based queries
CREATE INDEX idx_situations_date ON situations(user_id, situation_date);

------------------------
-- GUIDANCE RESOURCES
------------------------

-- Guidance content categories
CREATE TABLE guidance_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Initial data for guidance categories
INSERT INTO guidance_categories (name, description, icon_name) VALUES
('behavior', 'Behavioral guidance and discipline strategies', 'child'),
('sleep', 'Sleep advice and routines', 'moon-o'),
('eating', 'Nutrition and mealtime tips', 'cutlery'),
('development', 'Child development information', 'line-chart'),
('self-care', 'Self-care for parents', 'heart');

-- Guidance articles/resources
CREATE TABLE guidance_resources (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES guidance_categories(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_emoji VARCHAR(10), -- Emoji used as visual representation
    read_time_minutes INTEGER,
    age_range_min INTEGER, -- Minimum child age in months this applies to
    age_range_max INTEGER, -- Maximum child age in months this applies to
    published BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE, -- Added premium flag
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interaction with guidance resources
CREATE TABLE guidance_resource_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES guidance_resources(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    favorited BOOLEAN DEFAULT FALSE,
    engagement_seconds INTEGER DEFAULT 0, -- Time spent engaging with resource
    UNIQUE(user_id, resource_id)
);

-- Personalized recommendations based on user situation history
CREATE TABLE guidance_recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES guidance_resources(id),
    relevance_score DECIMAL(3,2), -- Algorithm-determined relevance (0.00-1.00)
    reason TEXT, -- Explanation for the recommendation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    viewed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, resource_id)
);

------------------------
-- SELF-CARE TRACKING
------------------------

-- Daily mood tracking
CREATE TABLE mood_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_type VARCHAR(50) NOT NULL CHECK (mood_type IN ('great', 'good', 'okay', 'stressed', 'exhausted', 'overwhelmed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, mood_date)
);

-- Self-care activity types
CREATE TABLE self_care_activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    benefits TEXT[],
    color_code VARCHAR(7), -- Kept for backward compatibility or other uses
    icon VARCHAR(50),      -- Renamed from icon_name for consistency
    color VARCHAR(7),      -- Added color column
    is_quick_relief BOOLEAN NOT NULL DEFAULT FALSE, -- Added flag for quick relief
    is_active BOOLEAN NOT NULL DEFAULT TRUE,       -- Added is_active flag
    is_system BOOLEAN DEFAULT TRUE -- True for system-provided, false for user-created
);

-- Logged self-care activities
CREATE TABLE self_care_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES self_care_activities(id),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    mood_before VARCHAR(50),
    mood_after VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Self-care reminders/schedule
CREATE TABLE self_care_reminders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES self_care_activities(id),
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('daily', 'weekly', 'custom')),
    days_of_week INTEGER[], -- Array of days (1=Monday, 7=Sunday)
    reminder_time TIME,
    custom_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

------------------------
-- PROGRESS TRACKING
------------------------

-- Weekly summaries generated from user data
CREATE TABLE progress_summaries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_situations INTEGER DEFAULT 0,
    situation_counts JSONB, -- Count by category
    mood_distribution JSONB, -- Percentage breakdown of moods
    self_care_minutes INTEGER DEFAULT 0,
    self_care_count INTEGER DEFAULT 0,
    insights JSONB[], -- Array of insight objects
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- Insights generated from user data
CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points JSONB, -- Supporting data for the insight
    relevance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    displayed BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE
);

-- Progress goals set by users
CREATE TABLE progress_goals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('self_care', 'behavior', 'sleep', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value INTEGER, -- Target value (minutes, count, etc.)
    current_value INTEGER DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------
-- APP USAGE METRICS
------------------------

-- Track feature usage for analytics
CREATE TABLE feature_usage (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    screen_name VARCHAR(100),
    action_type VARCHAR(100),
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- App sessions
CREATE TABLE app_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    device_info JSONB,
    app_version VARCHAR(20)
);

------------------------
-- SUBSCRIPTION PLANS
------------------------

-- Table for subscription plan details
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    trial_days INTEGER DEFAULT 0,
    features JSONB NOT NULL, -- Array of features included in this plan
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial subscription plans
INSERT INTO subscription_plans (plan_code, name, description, price_monthly, price_yearly, trial_days, features) VALUES
('free', 'Free Plan', 'Basic access for tracking and limited guidance', 0.00, 0.00, 0, '{"features": ["basic_tracking", "limited_guidance"]}'),
('premium', 'Premium Plan', 'Full access to all features including personalized guidance and unlimited tracking', 4.99, 49.99, 7, '{"features": ["unlimited_tracking", "full_guidance", "personalized_insights", "premium_content", "export_data"]}'),
('family', 'Family Plan', 'Premium features for up to 5 family members', 7.99, 79.99, 7, '{"features": ["unlimited_tracking", "full_guidance", "personalized_insights", "premium_content", "export_data", "multiple_profiles", "shared_tracking"]}');

------------------------
-- USER SUBSCRIPTIONS
------------------------

-- Table for tracking user subscriptions
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'trialing', 'past_due')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    external_subscription_id VARCHAR(255), -- ID from payment processor
    cancellation_date TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plan_id)
);

-- Subscription transaction history
CREATE TABLE subscription_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'trial_start', 'trial_end', 'cancellation', 'renewal')),
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    external_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
    error_message TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

------------------------
-- SUBSCRIPTION FEATURES & ACCESS CONTROL
------------------------

-- Feature definitions
CREATE TABLE subscription_features (
    id SERIAL PRIMARY KEY,
    feature_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Initial feature definitions
INSERT INTO subscription_features (feature_code, name, description, category) VALUES
('basic_tracking', 'Basic Situation Tracking', 'Track up to 50 parenting situations per month', 'tracking'),
('unlimited_tracking', 'Unlimited Tracking', 'Track unlimited parenting situations', 'tracking'),
('limited_guidance', 'Basic Guidance', 'Access to basic parenting guidance articles', 'content'),
('full_guidance', 'Full Guidance Library', 'Access to all guidance content including premium articles', 'content'),
('personalized_insights', 'Personalized Insights', 'Get personalized recommendations based on your parenting patterns', 'analysis'),
('premium_content', 'Premium Content', 'Access to expert-created guidance and resources', 'content'),
('export_data', 'Data Export', 'Export your tracking data to PDF or CSV', 'tools'),
('multiple_profiles', 'Multiple Child Profiles', 'Create separate profiles for multiple children', 'profiles'),
('shared_tracking', 'Shared Tracking', 'Share tracking access with co-parents or caregivers', 'collaboration');

-- Feature access log
CREATE TABLE feature_access_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL REFERENCES subscription_features(feature_code),
    access_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    granted BOOLEAN NOT NULL,
    reason VARCHAR(255) -- Reason for access denial if applicable
);

------------------------
-- PROMOTIONAL CODES
------------------------

-- Promo codes for discounts and free trials
CREATE TABLE promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_percentage INTEGER, -- Discount percentage (0-100)
    discount_amount DECIMAL(10, 2), -- Fixed discount amount
    trial_days INTEGER, -- Additional trial days
    max_uses INTEGER, -- Maximum number of uses (null for unlimited)
    used_count INTEGER DEFAULT 0,
    applicable_plans INTEGER[], -- Array of plan IDs this code applies to (null for all)
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Promo code usage by users
CREATE TABLE promo_code_redemptions (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id),
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    applied_discount DECIMAL(10, 2),
    UNIQUE(promo_code_id, user_id)
);

------------------------
-- USAGE LIMITS AND TRACKING
------------------------

-- Usage limits for free tier users
CREATE TABLE feature_usage_limits (
    id SERIAL PRIMARY KEY,
    feature_code VARCHAR(50) NOT NULL REFERENCES subscription_features(feature_code),
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('daily', 'monthly', 'total')),
    limit_value INTEGER NOT NULL,
    reset_frequency VARCHAR(50) CHECK (reset_frequency IN ('daily', 'weekly', 'monthly', 'never')),
    UNIQUE(feature_code, plan_id, limit_type)
);

-- Initial usage limits
INSERT INTO feature_usage_limits (feature_code, plan_id, limit_type, limit_value, reset_frequency) VALUES
((SELECT feature_code FROM subscription_features WHERE feature_code = 'basic_tracking'), 
 (SELECT id FROM subscription_plans WHERE plan_code = 'free'), 
 'monthly', 50, 'monthly');

-- Track feature usage for limited features
CREATE TABLE feature_usage_counts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL REFERENCES subscription_features(feature_code),
    usage_period VARCHAR(50) NOT NULL, -- Format: 'YYYY-MM' for monthly
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, feature_code, usage_period)
);

------------------------
-- STREAK TRACKING
------------------------

-- Track activity streaks for users
CREATE TABLE streak_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- e.g., 'self_care', 'mood_tracking', 'situation_tracking'
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    streak_start_date DATE, -- When the current streak started
    last_activity_date DATE, -- Date of last tracked activity
    activity_days INTEGER[] DEFAULT '{}', -- Array of weekdays (0=Sunday, 6=Saturday) with activity for current week
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Initial streak types 
-- INSERT INTO streak_tracking (user_id, streak_type, current_streak, longest_streak, streak_start_date, last_activity_date, activity_days)
-- VALUES
--     ('00000000-0000-0000-0000-000000000000', 'self_care', 3, 5, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE, '{1,2,3}'),
--     ('00000000-0000-0000-0000-000000000000', 'mood_tracking', 7, 12, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, '{0,1,2,3,4,5,6}'),
--     ('00000000-0000-0000-0000-000000000000', 'situation_tracking', 5, 8, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE, '{1,3,5,0,2}');

------------------------
-- INDEXES FOR PERFORMANCE
------------------------

-- Create indexes for common queries
CREATE INDEX idx_mood_entries_date ON mood_entries(user_id, mood_date);
CREATE INDEX idx_self_care_logs_date ON self_care_logs(user_id, log_date);
CREATE INDEX idx_feature_usage_date ON feature_usage(user_id, usage_date);
CREATE INDEX idx_situations_category ON situations(user_id, category_id);
CREATE INDEX idx_guidance_recommendations_user ON guidance_recommendations(user_id, relevance_score DESC);

-- Create indexes for common subscription queries
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(user_id, status);
CREATE INDEX idx_subscription_transactions_user ON subscription_transactions(user_id);
CREATE INDEX idx_feature_access_log_user ON feature_access_log(user_id, feature_code);
CREATE INDEX idx_promo_code_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX idx_feature_usage_counts_user ON feature_usage_counts(user_id, feature_code, usage_period);
CREATE INDEX idx_streak_tracking_user ON streak_tracking(user_id, streak_type);

------------------------
-- TRIGGERS AND FUNCTIONS
------------------------

-- Function to update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER update_user_profiles_modtime
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_situations_modtime
BEFORE UPDATE ON situations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_guidance_resources_modtime
BEFORE UPDATE ON guidance_resources
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_progress_goals_modtime
BEFORE UPDATE ON progress_goals
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Apply the trigger to subscription tables with updated_at
CREATE TRIGGER update_subscription_plans_modtime
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_subscriptions_modtime
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_streak_tracking_modtime
BEFORE UPDATE ON streak_tracking
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to calculate session duration when ended
CREATE OR REPLACE FUNCTION calculate_session_duration() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_app_session_duration
BEFORE UPDATE ON app_sessions
FOR EACH ROW
WHEN (OLD.end_time IS NULL AND NEW.end_time IS NOT NULL)
EXECUTE FUNCTION calculate_session_duration();

-- Function to check feature access based on subscription
CREATE OR REPLACE FUNCTION check_feature_access(p_user_id UUID, p_feature_code VARCHAR) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_subscription RECORD;
    v_feature_array JSONB;
    v_usage_count INTEGER;
    v_usage_limit INTEGER;
    v_current_period VARCHAR;
BEGIN
    -- Default to no access
    v_has_access := FALSE;
    
    -- Get current monthly period (YYYY-MM)
    v_current_period := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Check if user has an active subscription
    SELECT us.*, sp.features
    INTO v_subscription
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (us.end_date IS NULL OR us.end_date > NOW())
    ORDER BY sp.price_monthly DESC
    LIMIT 1;
    
    -- If subscription found, check if feature is included
    IF FOUND THEN
        -- Extract the features array from the JSONB
        v_feature_array := v_subscription.features->'features';
        
        -- Check if the feature code exists in the array
        SELECT jsonb_path_exists(v_feature_array, '$[*] ? (@ == $fc)', jsonb_build_object('fc', p_feature_code))
        INTO v_has_access;
    ELSE
        -- No subscription, check if feature is in free plan
        SELECT jsonb_path_exists(features->'features', '$[*] ? (@ == $fc)', jsonb_build_object('fc', p_feature_code))
        INTO v_has_access
        FROM subscription_plans
        WHERE plan_code = 'free';
    END IF;
    
    -- If access granted and feature has usage limits, check them
    IF v_has_access THEN
        -- Get usage limit if any
        SELECT fl.limit_value
        INTO v_usage_limit
        FROM feature_usage_limits fl
        JOIN subscription_plans sp ON fl.plan_id = sp.id
        WHERE fl.feature_code = p_feature_code
        AND (v_subscription.plan_id = fl.plan_id OR sp.plan_code = 'free')
        AND fl.limit_type = 'monthly'
        LIMIT 1;
        
        -- If limit exists, check current usage
        IF FOUND THEN
            -- Get current usage
            SELECT COALESCE(usage_count, 0)
            INTO v_usage_count
            FROM feature_usage_counts
            WHERE user_id = p_user_id
            AND feature_code = p_feature_code
            AND usage_period = v_current_period;
            
            -- Compare with limit
            IF v_usage_count >= v_usage_limit THEN
                v_has_access := FALSE;
            END IF;
        END IF;
    END IF;
    
    -- Log this access check
    INSERT INTO feature_access_log(user_id, feature_code, granted, reason)
    VALUES (
        p_user_id, 
        p_feature_code, 
        v_has_access, 
        CASE 
            WHEN NOT v_has_access AND v_usage_count >= v_usage_limit THEN 'Usage limit reached'
            WHEN NOT v_has_access THEN 'Feature not included in subscription'
            ELSE NULL
        END
    );
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql;

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(p_user_id UUID, p_feature_code VARCHAR) 
RETURNS VOID AS $$
DECLARE
    v_current_period VARCHAR;
BEGIN
    -- Get current monthly period (YYYY-MM)
    v_current_period := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Insert or update usage count
    INSERT INTO feature_usage_counts(user_id, feature_code, usage_period, usage_count, last_updated)
    VALUES (p_user_id, p_feature_code, v_current_period, 1, NOW())
    ON CONFLICT (user_id, feature_code, usage_period)
    DO UPDATE SET 
        usage_count = feature_usage_counts.usage_count + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql; 