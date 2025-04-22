import supabase from './supabase';

/**
 * Database utility class with methods for interacting with the database
 */
export class Database {
  /**
   * Initialize database connection
   */
  constructor() {
    this.supabase = supabase;
    this.isDebugMode = true; // Toggle for verbose logging
    this.logPrefix = '[DB]';
    console.log(`${this.logPrefix} Database client initialized with URL:`, 
      this.supabase.supabaseUrl ? this.supabase.supabaseUrl.substring(0, 30) + '...' : 'undefined');
  }

  /**
   * Debug log helper
   */
  log(...args) {
    if (this.isDebugMode) {
      console.log(this.logPrefix, ...args);
    }
  }

  /**
   * Get current user ID
   * @returns {string|null} User ID if authenticated
   */
  async getCurrentUserId() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      const userId = session?.user?.id || null;
      this.log('Current user ID:', userId ? userId.substring(0, 8) + '...' : 'not authenticated');
      return userId;
    } catch (error) {
      console.error('Error getting current user:', error.message);
      return null;
    }
  }

  /**
   * SITUATION TRACKING METHODS
   */

  /**
   * Get all situation categories
   * @returns {Promise<Array>} Categories array
   */
  async getSituationCategories() {
    try {
      this.log('Fetching situation categories from database');
      const { data, error } = await this.supabase
        .from('situation_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      this.log('Received categories from DB:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching situation categories:', error.message);
      return [];
    }
  }

  /**
   * Log a new parenting situation
   * @param {Object} situation Situation data
   * @returns {Promise<Object>} Created situation or error
   */
  async logSituation(situation) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log('Logging situation:', situation);
      
      // Ensure user exists before inserting related data
      const userExists = await this.ensureUserExists(userId);
      if (!userExists) {
        throw new Error('Failed to verify or create user record');
      }

      const { data, error } = await this.supabase
        .from('situations')
        .insert({
          ...situation,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error logging situation:', error.message);
      return { error };
    }
  }

  /**
   * Get user's situations for a specific date range
   * @param {string} startDate Start date in YYYY-MM-DD format
   * @param {string} endDate End date in YYYY-MM-DD format
   * @returns {Promise<Array>} Situations array
   */
  async getSituations(startDate, endDate) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Fetching situations from ${startDate} to ${endDate}`);
      
      // Validate date parameters
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      
      // Build the query
      let query = this.supabase
        .from('situations')
        .select(`
          *,
          situation_categories (id, name, color_code, icon_name)
        `)
        .eq('user_id', userId)
        .order('situation_date', { ascending: false });
      
      // Add date range filters
      if (startDate) {
        query = query.gte('situation_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('situation_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      this.log(`Retrieved ${data?.length || 0} situations`);
      return data || [];
    } catch (error) {
      console.error('Error fetching situations:', error.message);
      return [];
    }
  }

  /**
   * SELF-CARE METHODS
   */

  /**
   * Log user's mood
   * @param {Object} mood Mood data
   * @param {string} mood.type Mood type
   * @param {string} mood.date Date of the mood (YYYY-MM-DD)
   * @param {string} mood.notes Optional notes
   * @returns {Promise<Object>} Result with data or error
   */
  async logMood(mood) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log('Logging mood:', mood.type, 'for date:', mood.date);
      
      // Ensure user exists before inserting related data
      const userExists = await this.ensureUserExists(userId);
      if (!userExists) {
        throw new Error('Failed to verify or create user record');
      }
      
      // Normalize the date format
      const moodDate = mood.date || new Date().toISOString().split('T')[0];
      
      // Use upsert to handle both insert and update scenarios
      const { data, error } = await this.supabase
        .from('mood_entries')
        .upsert(
          {
            user_id: userId,
            mood_date: moodDate,
            mood_type: mood.type,
            notes: mood.notes || ''
          },
          {
            // Specify the unique constraint to match on
            onConflict: 'user_id,mood_date',
            // Fields to update if the record exists
            returning: 'representation'
          }
        )
        .select()
        .single();

      if (error) throw error;
      
      this.log(`Successfully ${data.id ? 'updated' : 'created'} mood entry for ${moodDate}`);
      return { data };
    } catch (error) {
      console.error('Error logging mood:', error.message);
      return { error };
    }
  }

  /**
   * Get user's mood history for a period
   * @param {string} startDate Start date (YYYY-MM-DD)
   * @param {string} endDate End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Mood entries array
   */
  async getMoodHistory(startDate, endDate) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Fetching mood history from ${startDate} to ${endDate}`);
      
      // Build query
      let query = this.supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('mood_date', { ascending: true });
      
      // Add date filters if provided
      if (startDate) {
        query = query.gte('mood_date', startDate);
      }
      if (endDate) {
        query = query.lte('mood_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      this.log(`Retrieved ${data?.length || 0} mood entries`);
      return data || [];
    } catch (error) {
      console.error('Error fetching mood history:', error.message);
      return [];
    }
  }

  /**
   * Get wellness summary for a period
   * @param {string} startDate Start date (YYYY-MM-DD)
   * @param {string} endDate End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Wellness summary object
   */
  async getWellnessSummary(startDate, endDate) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Generating wellness summary from ${startDate} to ${endDate}`);
      
      // Get mood data
      const moods = await this.getMoodHistory(startDate, endDate);
      
      // Get self-care data
      const selfCareLogs = await this.getSelfCareLogs(startDate, endDate);
      
      // Calculate summary statistics
      const totalSelfCareMinutes = selfCareLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const selfCareDays = [...new Set(selfCareLogs.map(log => log.log_date))].length;
      
      // Count mood types
      const moodCounts = {};
      moods.forEach(mood => {
        moodCounts[mood.mood_type] = (moodCounts[mood.mood_type] || 0) + 1;
      });
      
      // Calculate positive mood percentage (great, good)
      const positiveMoods = (moodCounts.great || 0) + (moodCounts.good || 0) + (moodCounts.positive || 0);
      const totalMoods = moods.length;
      const positiveMoodPercentage = totalMoods > 0 ? Math.round((positiveMoods / totalMoods) * 100) : 0;
      
      // Enhanced moodCounts for consistent structure
      const standardizedMoodCounts = {
        positive: positiveMoods,
        neutral: (moodCounts.neutral || 0) + (moodCounts.okay || 0),
        negative: (moodCounts.negative || 0) + (moodCounts.bad || 0) + (moodCounts.terrible || 0)
      };
      
      return {
        // Period metadata
        period: { startDate, endDate },
        
        // Self-care metrics
        totalSelfCareMinutes,
        selfCareDays,
        totalSelfCareActivities: selfCareLogs.length,
        averageSelfCareMinutesPerDay: selfCareDays > 0 ? Math.round(totalSelfCareMinutes / selfCareDays) : 0,
        
        // Mood metrics
        moodCounts: standardizedMoodCounts,
        detailedMoodCounts: moodCounts, // Preserve original detailed counts
        totalMoodEntries: totalMoods,
        positiveMoodPercentage
      };
    } catch (error) {
      console.error('Error generating wellness summary:', error.message);
      return {
        period: { startDate, endDate },
        totalSelfCareMinutes: 0,
        selfCareDays: 0,
        totalSelfCareActivities: 0,
        moodCounts: { positive: 0, neutral: 0, negative: 0 },
        detailedMoodCounts: {},
        totalMoodEntries: 0,
        positiveMoodPercentage: 0,
        averageSelfCareMinutesPerDay: 0
      };
    }
  }

  /**
   * Get self-care activities
   * @returns {Promise<Array>} Activities array
   */
  async getSelfCareActivities() {
    try {
      const { data, error } = await this.supabase
        .from('self_care_activities')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching self-care activities:', error.message);
      return [];
    }
  }

  /**
   * Helper to ensure user exists in the database
   * @param {string} userId User ID to check
   * @returns {Promise<boolean>} Whether the operation was successful
   * @private
   */
  async ensureUserExists(userId) {
    try {
      // Check if user exists
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (userCheckError) throw userCheckError;
      
      // If user doesn't exist, create a minimal record
      if (!existingUser) {
        this.log('User not found in database, creating record...');
        
        const { error: createUserError } = await this.supabase
          .from('users')
          .insert({
            id: userId,
            created_at: new Date().toISOString(),
            is_anonymous: true
          });
          
        if (createUserError) throw createUserError;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring user exists:', error.message);
      return false;
    }
  }

  /**
   * Log a self-care activity
   * @param {Object} activity Activity data to log
   * @param {number} [activity.activity_id] Activity ID (for predefined activities)
   * @param {string} activity.log_date Date of the activity (YYYY-MM-DD)
   * @param {number} activity.duration_minutes Duration in minutes
   * @param {string} [activity.notes] Optional notes
   * @param {string} [activity.mood_before] Mood before the activity
   * @param {string} [activity.mood_after] Mood after the activity
   * @param {boolean} [activity.is_custom] Whether this is a custom activity
   * @param {string} [activity.name] Name (for custom activities)
   * @param {string} [activity.category] Category (for custom activities)
   * @returns {Promise<Object>} Result with data or error
   */
  async logSelfCareActivity(activity) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log('Logging self-care activity:', activity);
      
      // Ensure user exists before inserting related data
      const userExists = await this.ensureUserExists(userId);
      if (!userExists) {
        throw new Error('Failed to verify or create user record');
      }
      
      // Handle custom activities differently than predefined ones
      if (activity.is_custom) {
        this.log('Processing custom activity:', activity.name);
        
        // For custom activities, we'll store the custom activity details in the notes field as JSON
        // since the schema doesn't have dedicated columns for custom activities
        const customActivityDetails = JSON.stringify({
          is_custom: true,
          name: activity.name,
          category: activity.category,
          original_notes: activity.notes || ''
        });
        
        // Use activity_id = 1 as a fallback/placeholder for custom activities
        // This assumes there's at least one activity with ID 1 in the self_care_activities table
        const { data, error } = await this.supabase
          .from('self_care_logs')
          .insert({
            user_id: userId,
            activity_id: 1, // Using a default activity ID as placeholder
            log_date: activity.log_date || new Date().toISOString().split('T')[0],
            duration_minutes: activity.duration_minutes,
            notes: customActivityDetails,
            mood_before: activity.mood_before,
            mood_after: activity.mood_after
          })
          .select()
          .single();

        if (error) throw error;
        
        // Track feature usage
        await this.trackFeatureUsage('log_custom_activity');
        
        return { data };
      } else {
        // Regular activities with an activity_id
        const { data, error } = await this.supabase
          .from('self_care_logs')
          .insert({
            user_id: userId,
            activity_id: activity.activity_id,
            log_date: activity.log_date || new Date().toISOString().split('T')[0],
            duration_minutes: activity.duration_minutes,
            notes: activity.notes,
            mood_before: activity.mood_before,
            mood_after: activity.mood_after
          })
          .select()
          .single();

        if (error) throw error;
        
        // Track feature usage
        await this.trackFeatureUsage('basic_tracking');
        
        return { data };
      }
    } catch (error) {
      console.error('Error logging self-care activity:', error.message);
      return { error };
    }
  }

  /**
   * Get user's self-care activity logs
   * @param {string} startDate Start date (YYYY-MM-DD)
   * @param {string} endDate End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Self-care logs array
   */
  async getSelfCareLogs(startDate, endDate) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Fetching self-care logs from ${startDate} to ${endDate}`);
      
      // Build query
      let query = this.supabase
        .from('self_care_logs')
        .select(`
          *,
          self_care_activities (*)
        `)
        .eq('user_id', userId)
        .order('log_date', { ascending: false });
      
      // Add date filters if provided
      if (startDate) {
        query = query.gte('log_date', startDate);
      }
      if (endDate) {
        query = query.lte('log_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Process the logs to extract custom activity information from notes field
      const processedLogs = data.map(log => {
        // Check if this is a custom activity by examining the notes field
        if (log.notes && typeof log.notes === 'string') {
          try {
            const customData = JSON.parse(log.notes);
            
            // If this is a custom activity
            if (customData.is_custom) {
              return {
                ...log,
                is_custom_activity: true,
                custom_activity_name: customData.name,
                custom_activity_category: customData.category,
                notes: customData.original_notes,
                // Create a custom self_care_activities object to match the standard format
                self_care_activities: {
                  id: log.activity_id,
                  name: customData.name,
                  category: customData.category,
                  is_custom: true
                }
              };
            }
          } catch (e) {
            // If notes is not valid JSON, it's not a custom activity
            // Just continue with the original log
          }
        }
        
        return log;
      });
      
      this.log(`Retrieved ${processedLogs.length || 0} self-care logs`);
      return processedLogs || [];
    } catch (error) {
      console.error('Error fetching self-care logs:', error.message);
      return [];
    }
  }
  
  /**
   * Get total self-care minutes for a period
   * @param {string} startDate Start date (YYYY-MM-DD)
   * @param {string} endDate End date (YYYY-MM-DD)
   * @returns {Promise<number>} Total minutes
   */
  async getSelfCareMinutes(startDate, endDate) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return 0;

      // Build query
      let query = this.supabase
        .from('self_care_logs')
        .select('duration_minutes')
        .eq('user_id', userId);
      
      // Add date filters if provided
      if (startDate) {
        query = query.gte('log_date', startDate);
      }
      if (endDate) {
        query = query.lte('log_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Sum up minutes
      const totalMinutes = data.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      return totalMinutes;
    } catch (error) {
      console.error('Error calculating self-care minutes:', error.message);
      return 0;
    }
  }

  /**
   * GUIDANCE METHODS
   */

  /**
   * Get guidance resources by category
   * @param {string} category Category ID or 'all'
   * @returns {Promise<Array>} Guidance resources array
   */
  async getGuidanceResources(category = 'all') {
    try {
      this.log('Fetching guidance resources, category:', category);
      let query = this.supabase
        .from('guidance_resources')
        .select(`
          *,
          guidance_categories (id, name, icon_name)
        `)
        .eq('published', true);

      if (category !== 'all') {
        query = query.eq('category_id', category);
      }

      const { data, error } = await query.order('title');

      if (error) throw error;
      this.log('Received resources from DB:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching guidance resources:', error.message);
      return [];
    }
  }

  /**
   * Get personalized recommendations for the user
   * @returns {Promise<Array>} Recommendations array
   */
  async getPersonalizedRecommendations() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      this.log('Fetching personalized recommendations for user');
      const { data, error } = await this.supabase
        .from('guidance_recommendations')
        .select(`
          *,
          guidance_resources (*)
        `)
        .eq('user_id', userId)
        .eq('viewed', false)
        .order('relevance_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      this.log('Received recommendations from DB:', data?.length || 0);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
      return [];
    }
  }

  /**
   * Get guidance categories
   * @returns {Promise<Array>} Categories array
   */
  async getGuidanceCategories() {
    try {
      this.log('Fetching guidance categories from database');
      const { data, error } = await this.supabase
        .from('guidance_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      this.log('Received guidance categories from DB:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching guidance categories:', error.message);
      return [];
    }
  }

  /**
   * PROGRESS METHODS
   */

  /**
   * Get wellness summary for a time period
   * @param {string} startDate Start date in YYYY-MM-DD format
   * @param {string} endDate End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Wellness summary statistics
   */
  // Note: The getWellnessSummary method is defined earlier in this file (around line 206)
  // This avoids duplication and keeps the codebase DRY

  /**
   * Get user's progress summaries
   * @param {number} limit Number of summaries to fetch
   * @returns {Promise<Array>} Progress summaries array
   */
  async getProgressSummaries(limit = 5) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('progress_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress summaries:', error.message);
      return [];
    }
  }

  /**
   * Get insights for the user
   * @returns {Promise<Array>} Insights array
   */
  async getInsights() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('insights')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('relevance_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching insights:', error.message);
      return [];
    }
  }

  /**
   * SUBSCRIPTION METHODS
   */

  /**
   * Check if user has access to a feature
   * @param {string} featureCode Feature code to check
   * @returns {Promise<boolean>} Whether user has access
   */
  async hasFeatureAccess(featureCode) {
    let userId = null; // Define userId in the outer scope for logging
    try {
      userId = await this.getCurrentUserId();

      // --- SPECIAL CASE: Basic Tracking ---
      // Grant 'basic_tracking' if the user is simply logged in (non-anonymous)
      // Adjust this logic if anonymous users should also get basic tracking
      if (featureCode === 'basic_tracking') {
          if (userId) {
               this.log(`Feature access for ${featureCode}: GRANTED (User Authenticated)`);
               // We don't necessarily need to log basic_tracking access attempts
               return true; // Grant basic tracking if user has an ID
          } else {
              this.log(`Feature access for ${featureCode}: DENIED (User not authenticated)`);
              return false; // Deny if not logged in
          }
      }

      // --- Standard Flow for Other Features ---

      // Require login for any other feature check
      if (!userId) {
        this.log(`Feature access for ${featureCode}: DENIED (User not authenticated)`);
        return false;
      }

      // Check Database Subscription Status
      let subscription = null;
      let hasAccess = false;
      let denialReason = 'No active/trialing subscription found in DB';

      try {
          subscription = await this.getUserSubscription(); // Fetches based on user_id

          if (subscription && subscription.subscription_plans) {
              // Found an active or trialing subscription record
              const planFeatures = subscription.subscription_plans.features; // JSONB column from plans table
              const planCode = subscription.subscription_plans.plan_code;
              const subStatus = subscription.status;
              denialReason = `Feature not included in current plan (${planCode} - ${subStatus})`; // Update potential reason

              // Check if the feature exists within the 'features' array inside the JSONB
              if (planFeatures && typeof planFeatures === 'object' && planFeatures.features && Array.isArray(planFeatures.features)) {
                  hasAccess = planFeatures.features.includes(featureCode);
              } else {
                  // Fallback if features structure is different or missing
                   console.warn(`Subscription plan features format is unexpected for plan ${planCode}:`, planFeatures);
                   // Check based on plan code logic if needed (less flexible)
                   const subscriptionFeatures = {
                      'free': ['basic_tracking', 'limited_guidance'], // Free plan includes basic
                      'premium': ['basic_tracking', 'limited_guidance', 'unlimited_tracking', 'full_guidance', 'personalized_insights', /* add others */],
                      'family': ['basic_tracking', 'limited_guidance', 'unlimited_tracking', 'full_guidance', 'personalized_insights', 'multiple_profiles', /* add others */]
                    };
                   hasAccess = subscriptionFeatures[planCode]?.includes(featureCode) || false;
              }

          } else {
             // No active/trialing record found in user_subscriptions
             // Check if the feature is part of the default 'free' plan definition implicitly
             // This handles users who are logged in but have no user_subscriptions row yet.
             const freePlanFeatures = ['basic_tracking', 'limited_guidance'];
             if (freePlanFeatures.includes(featureCode)) {
                 hasAccess = true;
                 denialReason = 'Granted via default free plan access (no subscription record)';
             } else {
                 hasAccess = false;
             }
          }

      } catch (dbError) {
          console.error(`Error checking DB for subscription during feature access for ${featureCode}:`, dbError.message);
          hasAccess = false;
          denialReason = 'Failed to check subscription status';
      }


      // Log the access attempt (excluding basic_tracking potentially)
      try {
        await this.supabase
          .from('feature_access_log')
          .insert({
            user_id: userId,
            feature_code: featureCode,
            granted: hasAccess,
            accessed_at: new Date().toISOString(),
            reason: hasAccess ? null : denialReason // Log the reason for denial
          });
      } catch (logError) {
        console.warn(`Failed to log feature access check: ${logError.message}`);
      }

      this.log(`Feature access check for ${featureCode}: ${hasAccess ? 'GRANTED' : 'DENIED'} (Reason: ${hasAccess ? 'N/A' : denialReason})`);
      return hasAccess;

    } catch (error) {
      console.error(`General Error checking access to feature ${featureCode} for user ${userId}:`, error.message);
       if (userId) {
           try {
              await this.supabase.from('feature_access_log').insert({
                 user_id: userId, feature_code: featureCode, granted: false, accessed_at: new Date().toISOString(), reason: 'General error during check'
              });
           } catch (logError) { /* Ignore log error */ }
       }
      return false;
    }
  }

  /**
   * Increment usage counter for a feature
   * @param {string} featureCode Feature code
   * @returns {Promise<void>}
   */
  async trackFeatureUsage(featureCode) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      this.log(`Tracking usage of ${featureCode} for user ${userId.substring(0, 8)}...`);
      
      // First check if the user has access to this feature
      const hasAccess = await this.hasFeatureAccess(featureCode);
      
      if (!hasAccess && !['basic_tracking', 'limited_guidance'].includes(featureCode)) {
        this.log(`User does not have access to ${featureCode}, skipping usage tracking`);
        return;
      }
      
      // Insert a usage record with explicit values for all required fields
      try {
        await this.supabase
          .from('feature_usage')
          .insert({
            user_id: userId,
            feature_code: featureCode,
            used_at: new Date().toISOString(),
            usage_count: 1
          });
          
        this.log(`Successfully tracked usage of ${featureCode}`);
      } catch (dbError) {
        console.warn(`Failed to insert feature usage record: ${dbError.message}`);
      }
    } catch (error) {
      console.error(`Error tracking feature usage for ${featureCode}:`, error.message);
      // Intentionally don't throw - this shouldn't block the user experience
    }
  }

  /**
   * Get user subscription details
   * @returns {Promise<Object>} Subscription details
   */
  async getUserSubscription() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error.message);
      return null;
    }
  }

  /**
   * Get available subscription plans
   * @returns {Promise<Array>} Subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error.message);
      return [];
    }
  }

  /**
   * Create a custom self-care activity
   * @param {Object} activity - The activity to create
   * @param {string} activity.name - Activity name
   * @param {string} activity.category - Activity category
   * @param {number} activity.duration_minutes - Duration in minutes
   * @param {string} activity.description - Activity description
   * @param {boolean} activity.is_custom - Whether this is a custom activity
   * @returns {Promise<Object>} - Created activity or error
   */
  async createSelfCareActivity(activity) {
    this.log('Creating self-care activity:', activity.name);
    
    try {
      // Ensure user exists
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.log('User not authenticated');
        return { error: { message: 'User not authenticated' } };
      }
      
      // Validate the activity
      if (!activity.name || !activity.category || !activity.duration_minutes) {
        this.log('Invalid activity data');
        return { error: { message: 'Invalid activity data' } };
      }
      
      // Track feature usage safely
      try {
        await this.trackFeatureUsage('create_self_care_activity');
      } catch (trackingError) {
        // Log but continue
        console.warn('Error tracking feature usage:', trackingError);
      }
      
      // In a real implementation, insert into the custom_activities table
      try {
        const { data, error } = await this.supabase
          .from('custom_activities')
          .insert({
            user_id: userId,
            name: activity.name,
            description: activity.description || '',
            duration_minutes: activity.duration_minutes,
            category: activity.category,
            created_at: new Date().toISOString(),
            color_code: activity.color_code || '#4B6D9B'
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Return the created activity with the custom ID format
        return {
          id: `custom-${data.id}`,
          ...data,
          is_custom: true,
          is_active: true,
          benefits: activity.description ? [activity.description] : []
        };
      } catch (dbError) {
        console.error('Database error creating activity:', dbError);
        
        // Fallback: return mock data with generated ID
        return {
          id: `custom-${Date.now()}`,
          user_id: userId,
          name: activity.name,
          description: activity.description || '',
          duration_minutes: activity.duration_minutes,
          category: activity.category,
          is_custom: true,
          is_active: true,
          created_at: new Date().toISOString(),
          benefits: activity.description ? [activity.description] : [],
          color_code: activity.color_code || '#4B6D9B',
        };
      }
    } catch (error) {
      this.log('Error creating self-care activity:', error);
      return { error: { message: 'Failed to create activity' } };
    }
  }

  /**
   * Get a user's current activity streaks
   * @param {string} [streakType] - Optional specific streak type to retrieve
   * @returns {Promise<Array|Object>} Array of streak objects or single streak object
   */
  async getUserStreaks(streakType = null) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Fetching user streaks${streakType ? ` for ${streakType}` : ''}`);
      
      let query = this.supabase
        .from('streak_tracking')
        .select('*')
        .eq('user_id', userId);
        
      // If a specific streak type is requested
      if (streakType) {
        query = query.eq('streak_type', streakType).maybeSingle();
      } else {
        query = query.order('streak_type');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (streakType) {
        // Return single streak object or null
        return data || null;
      }
      
      this.log(`Retrieved ${data?.length || 0} streak records`);
      return data || [];
    } catch (error) {
      console.error('Error fetching user streaks:', error.message);
      return streakType ? null : [];
    }
  }

  /**
   * Update streak for an activity type
   * @param {string} streakType - Type of streak to update
   * @param {Date} [activityDate=new Date()] - Date of the activity
   * @returns {Promise<Object>} Updated streak data
   */
  async updateStreak(streakType, activityDate = new Date()) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Format the activity date
      const formattedDate = activityDate.toISOString().split('T')[0];
      
      this.log(`Updating ${streakType} streak for date ${formattedDate}`);
      
      // Get current streak data
      const { data: existingStreak, error: fetchError } = await this.supabase
        .from('streak_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', streakType)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
      }
      
      // Day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = activityDate.getDay();
      
      // Initialize new streak if it doesn't exist
      if (!existingStreak) {
        this.log(`Creating new ${streakType} streak`);
        
        const newStreak = {
          user_id: userId,
          streak_type: streakType,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: formattedDate,
          streak_start_date: formattedDate,
          activity_days: [dayOfWeek]
        };
        
        const { data, error } = await this.supabase
          .from('streak_tracking')
          .insert(newStreak)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
      
      // Calculate days since last activity
      const lastActivityDate = new Date(existingStreak.last_activity_date);
      const timeDiff = activityDate.getTime() - lastActivityDate.getTime();
      const daysSinceLastActivity = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      // Update activity days for current week
      let activityDays = [...existingStreak.activity_days];
      if (!activityDays.includes(dayOfWeek)) {
        activityDays.push(dayOfWeek);
      }
      
      // If it's a new week, reset activity days
      const lastActivityWeek = this.getWeekNumber(lastActivityDate);
      const currentWeek = this.getWeekNumber(activityDate);
      
      if (lastActivityWeek !== currentWeek) {
        this.log('New week detected, resetting activity days');
        activityDays = [dayOfWeek];
      }
      
      // Update streak count based on consecutive days
      let currentStreak = existingStreak.current_streak;
      let streakStartDate = existingStreak.streak_start_date;
      
      // If activity is for today or yesterday, streak continues
      if (daysSinceLastActivity <= 1 && daysSinceLastActivity >= 0) {
        // Only increment if this is a new day
        if (daysSinceLastActivity === 1) {
          currentStreak += 1;
        }
      } else if (daysSinceLastActivity > 1) {
        // Streak broken, reset
        this.log('Streak broken, resetting');
        currentStreak = 1;
        streakStartDate = formattedDate;
      }
      
      // Calculate longest streak
      const longestStreak = Math.max(existingStreak.longest_streak, currentStreak);
      
      // Update the streak record
      const updatedStreak = {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: formattedDate,
        streak_start_date: streakStartDate,
        activity_days: activityDays
      };
      
      const { data, error } = await this.supabase
        .from('streak_tracking')
        .update(updatedStreak)
        .eq('id', existingStreak.id)
        .select()
        .single();
        
      if (error) throw error;
      
      this.log(`Updated ${streakType} streak: ${currentStreak} days`);
      return data;
    } catch (error) {
      console.error(`Error updating ${streakType} streak:`, error.message);
      return null;
    }
  }

  /**
   * Get week number of the year for a date
   * @private
   * @param {Date} date - Date to get week number for
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get a week's activity streak
   * @param {string} streakType - Type of streak
   * @returns {Promise<Object>} Week streak info with days active
   */
  async getWeekStreak(streakType) {
    try {
      const streak = await this.getUserStreaks(streakType);
      
      if (!streak) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          activeDays: [],
          weekComplete: false
        };
      }
      
      // Map day numbers (0-6) to day abbreviations (S-S)
      const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const activeDays = streak.activity_days.map(day => ({
        dayNumber: day,
        dayLabel: dayAbbreviations[day],
        isActive: true
      }));
      
      // Add inactive days
      const allDays = Array.from({ length: 7 }, (_, i) => {
        const existing = activeDays.find(d => d.dayNumber === i);
        if (existing) return existing;
        
        return {
          dayNumber: i,
          dayLabel: dayAbbreviations[i],
          isActive: false
        };
      }).sort((a, b) => a.dayNumber - b.dayNumber);
      
      return {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        activeDays: allDays,
        weekComplete: activeDays.length >= 7,
        lastActivityDate: streak.last_activity_date
      };
    } catch (error) {
      console.error(`Error getting week streak for ${streakType}:`, error.message);
      return {
        currentStreak: 0,
        longestStreak: 0,
        activeDays: [],
        weekComplete: false
      };
    }
  }

  /**
   * MOCK: Activate a subscription plan for the user (for testing)
   * @param {string} planId - ID of the plan to activate
   * @returns {Promise<Object>} Result with data or error
   */
  async mockActivateSubscription(planId) {
    const userId = await this.getCurrentUserId(); // Keep userId in scope for logging
    try {
      if (!userId) throw new Error('User not authenticated');

      console.log(`[mockActivateSubscription] User ID: ${userId}`); // Log User ID

      const userExists = await this.ensureUserExists(userId);
      if (!userExists) {
          throw new Error('Failed to verify or create user record in public users table');
      }
      console.log('[mockActivateSubscription] User ensured.'); // Log after ensure

      this.log(`MOCK: Activating plan ${planId} for user ${userId.substring(0, 8)}...`);

      // Fetch plan details to get trial days if any
      const { data: planDetails, error: planError } = await this.supabase
        .from('subscription_plans')
        .select('trial_days')
        .eq('id', planId)
        .maybeSingle(); // Use maybeSingle here too for safety

      // Log plan fetch result
      if (planError) {
           console.error('[mockActivateSubscription] Error fetching plan details:', planError);
           throw planError;
      }
      console.log('[mockActivateSubscription] Fetched plan details:', planDetails);


      const trialDays = planDetails?.trial_days || 0;
      const now = new Date();
      const startDate = now.toISOString();
      let endDate = null;
      let trialEndDate = null;
      let status = 'active';

      if (trialDays > 0) {
        status = 'trialing';
        trialEndDate = new Date(now);
        trialEndDate.setDate(now.getDate() + trialDays);
        trialEndDate = trialEndDate.toISOString();
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 10);
        endDate = endDate.toISOString();
      } else {
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 10);
        endDate = endDate.toISOString();
      }


      const subscriptionData = { // Prepare data for logging
          user_id: userId,
          plan_id: planId,
          status: status,
          start_date: startDate,
          end_date: endDate,
          trial_end_date: trialEndDate,
          auto_renew: true,
          updated_at: now.toISOString()
      };
      console.log('[mockActivateSubscription] Attempting upsert with data:', JSON.stringify(subscriptionData)); // Log data before upsert

      // Upsert the subscription record
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, {
            onConflict: 'user_id,plan_id',
            returning: 'representation',
          }
        )
        .select()
        .maybeSingle(); // Use maybeSingle, upsert might not return if no change

      // Log upsert result
      if (error) {
        console.error('[mockActivateSubscription] Error during upsert:', error);
        throw error;
      }
      console.log('[mockActivateSubscription] Upsert successful, result:', data); // Log success


      // Optional: Deactivate other active/trialing subscriptions
      if (data?.id) { // Only proceed if upsert returned a row/id
          console.log(`[mockActivateSubscription] Deactivating other subscriptions for user ${userId}, except ID ${data.id}`);
          const { error: updateError } = await this.supabase
             .from('user_subscriptions')
             .update({ status: 'canceled', auto_renew: false, updated_at: now.toISOString() })
             .eq('user_id', userId)
             .neq('id', data.id)
             .in('status', ['active', 'trialing']);

           if (updateError) {
               console.warn('[mockActivateSubscription] Could not deactivate other subscriptions:', updateError.message);
           } else {
                console.log('[mockActivateSubscription] Successfully deactivated other subscriptions.');
           }
      } else {
           console.warn('[mockActivateSubscription] Upsert did not return data, skipping deactivation of others.');
      }


      this.log(`MOCK: Successfully activated plan ${planId} for user ${userId.substring(0, 8)}. Status: ${status}`);
      return { data };
    } catch (error) {
      console.error(`[mockActivateSubscription] MOCK FUNCTION FAILED for user ${userId} and plan ${planId}:`, error.message); // More specific log
      return { error };
    }
  }

  /**
   * Cancel the user's active/trialing subscription (sets auto_renew to false).
   * @returns {Promise<Object>} Result with updated subscription data or error
   */
  async cancelSubscription() {
    let userId = null;
    try {
      userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Attempting to cancel subscription for user ${userId.substring(0, 8)}...`);

      // 1. Find the current active or trialing subscription ID
      const { data: currentSubscription, error: fetchError } = await this.supabase
        .from('user_subscriptions')
        .select('id, status, end_date') // Select needed fields including ID
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
          console.error('[cancelSubscription] Error fetching current subscription:', fetchError);
          throw fetchError;
      }

      if (!currentSubscription) {
          this.log(`[cancelSubscription] No active/trialing subscription found for user ${userId}.`);
          throw new Error('No active subscription found to cancel.');
      }

      this.log(`[cancelSubscription] Found subscription ID ${currentSubscription.id} with status ${currentSubscription.status}.`);

      // 2. Update the subscription to disable auto-renewal
      const now = new Date().toISOString();
      const { data: updatedSubscription, error: updateError } = await this.supabase
        .from('user_subscriptions')
        .update({
          auto_renew: false,
          status: currentSubscription.status, // Keep current status (active/trialing)
          cancellation_date: now, // Record cancellation time
          updated_at: now
        })
        .eq('id', currentSubscription.id) // Target the specific subscription
        .select() // Select the updated row
        .single();

      if (updateError) {
        console.error('[cancelSubscription] Error updating subscription:', updateError);
        throw updateError;
      }

      this.log(`[cancelSubscription] Successfully marked subscription ${updatedSubscription.id} for non-renewal. Access ends: ${updatedSubscription.end_date}`);
      return { data: updatedSubscription };

    } catch (error) {
      console.error(`[cancelSubscription] Failed for user ${userId}:`, error.message);
      return { error };
    }
  }

  /**
   * Reactivate auto-renewal for a user's cancelled subscription.
   * @returns {Promise<Object>} Result with updated subscription data or error
   */
  async reactivateSubscription() {
    let userId = null;
    try {
      userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      this.log(`Attempting to reactivate subscription for user ${userId.substring(0, 8)}...`);

      // 1. Find the subscription that was cancelled but is still technically active/trialing until end_date
      const { data: cancelledSubscription, error: fetchError } = await this.supabase
        .from('user_subscriptions')
        .select('id, status, end_date, auto_renew')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing']) // Should still be active or trialing
        .eq('auto_renew', false) // Specifically find one marked not to renew
        .gt('end_date', new Date().toISOString()) // Ensure it hasn't actually expired yet
        .order('end_date', { ascending: false }) // Find the one ending latest if multiple exist
        .limit(1)
        .maybeSingle();

      if (fetchError) {
          console.error('[reactivateSubscription] Error fetching cancelled subscription:', fetchError);
          throw fetchError;
      }

      if (!cancelledSubscription) {
          this.log(`[reactivateSubscription] No cancellable (but still active/trialing) subscription found for user ${userId}.`);
          throw new Error('No suitable subscription found to reactivate.');
      }

      this.log(`[reactivateSubscription] Found cancelled subscription ID ${cancelledSubscription.id} ending ${cancelledSubscription.end_date}.`);

      // 2. Update the subscription to re-enable auto-renewal
      const now = new Date().toISOString();
      const { data: updatedSubscription, error: updateError } = await this.supabase
        .from('user_subscriptions')
        .update({
          auto_renew: true,             // Turn renewal back on
          cancellation_date: null,      // Clear cancellation date
          updated_at: now
        })
        .eq('id', cancelledSubscription.id) // Target the specific subscription
        .select()
        .single();

      if (updateError) {
        console.error('[reactivateSubscription] Error updating subscription:', updateError);
        throw updateError;
      }

      this.log(`[reactivateSubscription] Successfully reactivated subscription ${updatedSubscription.id}. It will now renew.`);
      return { data: updatedSubscription };

    } catch (error) {
      console.error(`[reactivateSubscription] Failed for user ${userId}:`, error.message);
      return { error };
    }
  }
}

// Create and export a single instance
const dbInstance = new Database();
export default dbInstance;