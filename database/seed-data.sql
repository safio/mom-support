-- Seed data for Mom Support App
-- This file contains all initial data for the app to function properly

-- Clear existing data
TRUNCATE guidance_categories, guidance_resources, situation_categories, 
         self_care_activities, subscription_plans, subscription_features, streak_tracking RESTART IDENTITY CASCADE;

-- Create a Demo User for streak data
INSERT INTO users (id, email, is_anonymous, account_status) VALUES
('00000000-0000-0000-0000-000000000000', NULL, TRUE, 'active');

-- Guidance Categories
INSERT INTO guidance_categories (id, name, icon_name, description, is_active) VALUES
(1, 'Behavior Management', 'child', 'Strategies for managing difficult behaviors', true),
(2, 'Sleep Routines', 'moon-o', 'Help with establishing healthy sleep habits', true),
(3, 'Emotional Wellbeing', 'heart', 'Supporting emotional development', true),
(4, 'Developmental Milestones', 'line-chart', 'Understanding child development stages', true),
(5, 'Self-Care for Moms', 'user', 'Taking care of yourself as a parent', true);

-- Guidance Resources
INSERT INTO guidance_resources (id, title, summary, content, category_id, published, is_premium, created_at, updated_at) VALUES
(1, 'Handling Tantrums Effectively', 
   'Effective strategies for managing tantrums in young children',
   'Tantrums are a normal part of child development. When faced with a tantrum, stay calm, acknowledge feelings, offer choices, and be consistent with boundaries.',
   1, true, false, NOW(), NOW()),
   
(2, 'Creating a Bedtime Routine', 
   'How to establish a consistent and effective bedtime routine',
   'A consistent bedtime routine signals to your child that it''s time to wind down. Include activities like bath, brushing teeth, reading a story, and quiet time.',
   2, true, false, NOW(), NOW()),
   
(3, 'Helping Children Express Emotions', 
   'Guide to supporting healthy emotional development',
   'Teach emotional vocabulary, model emotional expression, validate feelings, and create a safe space for emotional expression.',
   3, true, true, NOW(), NOW()),
   
(4, 'What to Expect at Age 3-4', 
   'Understanding typical development milestones for 3-4 year olds',
   'Between ages 3-4, children typically develop more independence, imagination, social skills, and physical coordination.',
   4, true, false, NOW(), NOW()),
   
(5, '5-Minute Self-Care Practices', 
   'Quick self-care activities for busy parents',
   'Even 5 minutes of self-care can make a difference. Try deep breathing, stretching, journaling, or enjoying a cup of tea mindfully.',
   5, true, false, NOW(), NOW()),
   
(6, 'Setting Effective Boundaries', 
   'How to create and maintain healthy boundaries with children',
   'Clear boundaries help children feel secure. Be consistent, use clear language, follow through, and adjust boundaries as children grow.',
   1, true, true, NOW(), NOW()),
   
(7, 'Dealing with Night Waking', 
   'Strategies for handling sleep disruptions',
   'Night waking can be disruptive. Establish a brief reassurance routine, keep interactions minimal, ensure the sleep environment is comfortable, and be consistent.',
   2, true, true, NOW(), NOW());

-- Situation Categories
INSERT INTO situation_categories (id, name, description, color_code, icon_name, is_active) VALUES
(1, 'Behavior', 'Track behavioral situations and challenges', '#FFA726', 'exclamation-circle', true),
(2, 'Sleep', 'Log sleep patterns and bedtime situations', '#5C6BC0', 'moon-o', true),
(3, 'Eating', 'Record mealtime experiences and food-related challenges', '#66BB6A', 'cutlery', true),
(4, 'Positive Moments', 'Celebrate wins and positive parenting experiences', '#EF5350', 'heart', true);

-- Self-Care Activities
INSERT INTO self_care_activities (id, name, description, duration_minutes, category, is_active, icon, color, is_quick_relief) VALUES
(1, 'Deep Breathing', 'Breathe in for 4 seconds, hold for 4, exhale for 6.', 2, 'Relaxation', true, 'wind', '#64B5F6', true),
(2, 'Short Walk', 'Take a brief walk outside', 15, 'Physical', true, 'walking', '#AED581', false),
(3, 'Journaling', 'Write down thoughts and feelings', 10, 'Emotional', true, 'pencil-alt', '#FFD54F', false),
(4, 'Cup of Tea', 'Enjoy a quiet cup of tea', 10, 'Relaxation', true, 'coffee', '#BCAAA4', false),
(5, 'Stretch Break', 'Quick stretching session', 5, 'Physical', true, 'running', '#81D4FA', false),
(6, 'Body Scan', 'Focus attention on each part of your body, releasing tension.', 5, 'Mindfulness', true, 'user', '#9575CD', true),
(7, 'Guided Visualization', 'Imagine a peaceful place where you feel calm and relaxed.', 3, 'Mindfulness', true, 'tree', '#81C784', true);

-- Subscription Plans
INSERT INTO subscription_plans (id, plan_code, name, description, price_monthly, price_yearly, trial_days, features, is_active) VALUES
(1, 'free', 'Basic', 'Free basic access with limited features', 0.00, 0.00, 0, 
   '{"basic_tracking": true, "limited_guidance": true, "unlimited_tracking": false, "full_guidance": false, "personalized_insights": false}', 
   true),
   
(2, 'premium', 'Premium', 'Full access to all features', 4.99, 49.99, 14, 
   '{"basic_tracking": true, "limited_guidance": true, "unlimited_tracking": true, "full_guidance": true, "personalized_insights": true}', 
   true),
   
(3, 'family', 'Family', 'Premium features for the whole family', 7.99, 79.99, 14, 
   '{"basic_tracking": true, "limited_guidance": true, "unlimited_tracking": true, "full_guidance": true, "personalized_insights": true, "multiple_profiles": true}', 
   true);

-- Subscription Features
INSERT INTO subscription_features (id, feature_code, name, description, category, is_active) VALUES
(1, 'basic_tracking', 'Basic Tracking', 'Track up to 10 situations per month', 'tracking', true),
(2, 'unlimited_tracking', 'Unlimited Tracking', 'Track unlimited situations', 'tracking', true),
(3, 'limited_guidance', 'Basic Guidance', 'Access to basic guidance resources', 'guidance', true),
(4, 'full_guidance', 'Full Guidance', 'Access to all guidance resources', 'guidance', true),
(5, 'personalized_insights', 'Personalized Insights', 'Receive personalized insights based on your tracking', 'insights', true);

-- Streak Tracking Data (for demo user)
INSERT INTO streak_tracking (id, user_id, streak_type, current_streak, longest_streak, streak_start_date, last_activity_date, activity_days) VALUES
(1, '00000000-0000-0000-0000-000000000000', 'mood_tracking', 5, 12, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE, '{1,2,3,4,5}'),
(2, '00000000-0000-0000-0000-000000000000', 'situation_tracking', 3, 8, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE, '{2,3,4}'),
(3, '00000000-0000-0000-0000-000000000000', 'self_care', 1, 5, CURRENT_DATE, CURRENT_DATE, '{4}');

-- Reset sequences to match the highest ID values
SELECT setval('guidance_categories_id_seq', (SELECT MAX(id) FROM guidance_categories));
SELECT setval('guidance_resources_id_seq', (SELECT MAX(id) FROM guidance_resources));
SELECT setval('situation_categories_id_seq', (SELECT MAX(id) FROM situation_categories));
SELECT setval('self_care_activities_id_seq', (SELECT MAX(id) FROM self_care_activities));
SELECT setval('subscription_plans_id_seq', (SELECT MAX(id) FROM subscription_plans));
SELECT setval('subscription_features_id_seq', (SELECT MAX(id) FROM subscription_features));
SELECT setval('streak_tracking_id_seq', (SELECT MAX(id) FROM streak_tracking)); 