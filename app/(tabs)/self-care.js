import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import Button from '../components/Button';
import ActivityModal from '../components/ActivityModal';

export default function SelfCareScreen() {
  const { db, isReady, checkFeatureAccess, trackFeatureUsage } = useDatabase();
  const { isAuthenticated } = useAuth();
  
  // State variables
  const [selectedMood, setSelectedMood] = useState(null);
  const [savingMood, setSavingMood] = useState(false);
  const [activities, setActivities] = useState([]);
  const [selfCareLogs, setSelfCareLogs] = useState([]);
  const [recentlyLogged, setRecentlyLogged] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [wellnessSummary, setWellnessSummary] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quickReliefActivities, setQuickReliefActivities] = useState([]);
  
  // Moods for tracking
  const moodOptions = [
    { id: 'great', emoji: '😄', label: '', color: '#4CAF50' },
    { id: 'good', emoji: '🙂', label: 'Good', color: '#8BC34A' },
    { id: 'okay', emoji: '😐', label: 'Okay', color: '#FFC107' },
    { id: 'stressed', emoji: '😓', label: 'Stressed', color: '#FF9800' },
    { id: 'exhausted', emoji: '😩', label: 'Exhausted', color: '#F44336' },
    { id: 'overwhelmed', emoji: '😰', label: 'Overwhelmed', color: '#E91E63' },
  ];
  
  // Quick relief exercises - REMOVED
  /*
  const quickReliefExercises = [
    {
      id: '1',
      title: 'Deep Breathing',
      duration: '2 min',
      description: 'Breathe in for 4 seconds, hold for 4, exhale for 6.',
      icon: 'wind',
      color: '#64B5F6',
      activity_id: 1 // Corresponds to the DB activity ID
    },
    {
      id: '2',
      title: 'Body Scan',
      duration: '5 min',
      description: 'Focus attention on each part of your body, releasing tension.',
      icon: 'user',
      color: '#9575CD',
      activity_id: 2 // Corresponds to the DB activity ID
    },
    {
      id: '3',
      title: 'Guided Visualization',
      duration: '3 min',
      description: 'Imagine a peaceful place where you feel calm and relaxed.',
      icon: 'tree',
      color: '#81C784',
      activity_id: 3 // Corresponds to the DB activity ID
    },
  ];
  */
  
  // Last 7 days for mood history
  const [moodHistory, setMoodHistory] = useState([
    { day: 'Mon', mood: null },
    { day: 'Tue', mood: null },
    { day: 'Wed', mood: null },
    { day: 'Thu', mood: null },
    { day: 'Fri', mood: null },
    { day: 'Sat', mood: null },
    { day: 'Sun', mood: null },
  ]);
  
  // Load data when component mounts
  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);
  
  // Load data from database
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has access to self-care features
      const canAccessFeature = await checkFeatureAccess('basic_tracking');
      setHasAccess(canAccessFeature);
      
      if (canAccessFeature) {
        // Track feature usage
        await trackFeatureUsage('basic_tracking');
        
        // Load self-care activities
        const activitiesData = await db.getSelfCareActivities();
        if (activitiesData.length > 0) {
          setActivities(activitiesData);
          // Filter for quick relief activities
          setQuickReliefActivities(activitiesData.filter(act => act.is_quick_relief));
        } else {
          setQuickReliefActivities([]); // Ensure it's empty if no activities
        }
        
        // Get date range for last week
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        const startDate = oneWeekAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        // Load self-care logs
        const logsData = await db.getSelfCareLogs(startDate, endDate);
        if (logsData.length > 0) {
          setSelfCareLogs(logsData);
          
          // Process logs to update mood history
          updateMoodHistoryFromLogs(logsData);
        }
        
        // Get wellness summary
        const summary = await db.getWellnessSummary(startDate, endDate);
        setWellnessSummary(summary);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading self-care data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update mood history from database logs
  const updateMoodHistoryFromLogs = (logs) => {
    // Create a copy of the mood history
    const updatedHistory = [...moodHistory];
    
    // Get dates for the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: updatedHistory[6-i].day
      });
    }
    
    // Match logs to dates
    dates.forEach((dateInfo, index) => {
      // Find mood entries for this date
      const moodLog = logs.find(log => 
        log.log_date === dateInfo.date && log.mood_after
      );
      
      if (moodLog) {
        updatedHistory[index].mood = moodLog.mood_after;
      }
    });
    
    setMoodHistory(updatedHistory);
  };
  
  // Save mood to database
  const handleSaveMood = async () => {
    if (!selectedMood) return;
    
    setSavingMood(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const result = await db.logMood({
        type: selectedMood,
        date: today,
        notes: ''
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Update the mood history
      const updatedHistory = [...moodHistory];
      const todayIndex = updatedHistory.findIndex(
        item => item.day === new Date().toLocaleString('en-US', { weekday: 'short' }).substring(0, 3)
      );
      
      if (todayIndex !== -1) {
        updatedHistory[todayIndex].mood = selectedMood;
        setMoodHistory(updatedHistory);
      }
      
      // Reset selected mood
      setSelectedMood(null);
      
      // Show success message
      Alert.alert('Success', 'Your mood has been saved.');
      
      // Refresh wellness summary
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(new Date().getDate() - 7);
      
      const startDate = oneWeekAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const summary = await db.getWellnessSummary(startDate, endDate);
      setWellnessSummary(summary);
      
      // Update streak data for mood tracking
      try {
        await db.updateStreak('mood_tracking', new Date());
      } catch (streakError) {
        console.error('Error updating mood tracking streak:', streakError);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood. Please try again.');
      console.error('Error saving mood:', error);
    } finally {
      setSavingMood(false);
    }
  };
  
  // Log a self-care activity
  const handleLogActivity = async (activity, category) => {
    try {
      // Add additional validation here if needed
      const today = new Date().toISOString().split('T')[0];
      
      // Extract duration from the activity
      let durationMinutes = activity.duration_minutes;
      if (!durationMinutes && activity.duration) {
        // Parse from string like "5 min"
        durationMinutes = parseInt(activity.duration.replace(/[^0-9]/g, ''));
      }
      
      if (!durationMinutes) {
        durationMinutes = 5; // Default to 5 minutes if not specified
      }
      
      // Check if this is a custom activity (ID starts with "custom-")
      const isCustomActivity = typeof activity.id === 'string' && activity.id.startsWith('custom-');
      
      // Create the log object
      const activityLog = {
        log_date: today,
        duration_minutes: durationMinutes,
        notes: '',
        mood_before: selectedMood,
        mood_after: selectedMood
      };
      
      if (isCustomActivity) {
        // For custom activities
        activityLog.is_custom = true;
        activityLog.name = activity.name || activity.title;
        activityLog.category = category;
      } else {
        // For regular activities
        activityLog.activity_id = activity.activity_id || activity.id;
      }
      
      // Log the activity
      const result = await db.logSelfCareActivity(activityLog);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Update the recently logged activity
      setRecentlyLogged({
        ...activity,
        category,
        loggedAt: new Date()
      });
      
      // Show success message
      Alert.alert('Success', `${activity.title || activity.name} has been logged.`);
      
      // Refresh data
      loadData();
      
      // Update streak data for self-care
      try {
        await db.updateStreak('self_care', new Date());
      } catch (streakError) {
        console.error('Error updating self-care streak:', streakError);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log activity. Please try again.');
      console.error('Error logging activity:', error);
    }
  };
  
  // Get mood emoji from id
  const getMoodEmoji = (moodId) => {
    const mood = moodOptions.find(m => m.id === moodId);
    return mood ? mood.emoji : '❓';
  };
  
  // Handle saving a new custom activity
  const handleSaveCustomActivity = (newActivity) => {
    // Add the new activity to the activities state
    setActivities([newActivity, ...activities]);
    
    // Show success message
    Alert.alert('Success', 'Custom activity created successfully!');
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4B6D9B" />
        <Text style={styles.loadingText}>Loading self-care data...</Text>
      </View>
    );
  }
  
  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          label="Retry" 
          onPress={loadData} 
          variant="primary" 
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }
  
  // No access state
  if (!hasAccess) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <FontAwesome5 name="lock" size={40} color="#758494" style={styles.lockIcon} />
        <Text style={styles.noAccessTitle}>Feature Locked</Text>
        <Text style={styles.noAccessText}>
          {isAuthenticated 
            ? "You don't have access to this feature with your current subscription."
            : "Please log in to access all features."}
        </Text>
        <Button 
          label={isAuthenticated ? "Upgrade Plan" : "Sign In"} 
          variant="primary"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Self-Care</Text>
            <Text style={styles.subtitle}>Taking care of yourself matters</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsNumber}>{wellnessSummary?.totalSelfCareMinutes || 0}</Text>
            <Text style={styles.statsLabel}>Minutes</Text>
          </View>
        </View>
        
        {/* Wellness Summary */}
        {wellnessSummary && (
          <Card gradient gradientColors={['#EFF6FF', '#E4EDFF']} style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Your Wellness This Week</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{wellnessSummary.positiveMoodPercentage}%</Text>
                <Text style={styles.summaryLabel}>Positive Moods</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{wellnessSummary.selfCareDays}</Text>
                <Text style={styles.summaryLabel}>Self-Care Days</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{wellnessSummary.totalSelfCareMinutes}</Text>
                <Text style={styles.summaryLabel}>Minutes Total</Text>
              </View>
            </View>
          </Card>
        )}
        
        {/* Mood Tracker */}
        <Card style={styles.moodTrackerCard}>
          <Text style={styles.cardTitle}>How are you feeling today?</Text>
          
          <View style={styles.moodOptionsContainer}>
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  selectedMood === mood.id && styles.selectedMoodOption,
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel, 
                  selectedMood === mood.id && styles.selectedMoodLabel
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Button
            label="Save Mood"
            disabled={!selectedMood || savingMood}
            onPress={handleSaveMood}
            isLoading={savingMood}
            fullWidth
            style={styles.saveMoodButton}
          />
        </Card>
        
        {/* Mood History */}
        <Card style={styles.moodHistoryCard}>
          <Text style={styles.cardTitle}>Your Week</Text>
          <View style={styles.moodHistoryChart}>
            {moodHistory.map((item, index) => (
              <View key={index} style={styles.moodHistoryDay}>
                <Text style={styles.moodHistoryEmoji}>
                  {item.mood ? getMoodEmoji(item.mood) : ''}
                </Text>
                <View style={[
                  styles.dayIndicator,
                  item.mood && styles.activeDayIndicator
                ]} />
                <Text style={styles.moodHistoryDayText}>{item.day}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        {/* Quick Relief */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Relief</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickReliefList}>
          {quickReliefActivities.map((exercise) => (
            <TouchableOpacity key={exercise.id} style={styles.quickReliefItem} onPress={() => handleLogActivity(exercise, 'Quick Relief')}>
              <View style={styles.quickReliefIconContainer}>
                <FontAwesome5 name={exercise.icon} size={20} color={exercise.color} />
              </View>
              <Text style={styles.quickReliefTitle}>{exercise.title}</Text>
              <Text style={styles.quickReliefDuration}>{exercise.duration_minutes} min</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Self-Care Activities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Self-Care Activities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Filter</Text>
          </TouchableOpacity>
        </View>
        
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Card key={activity.id} style={styles.activityCard} onPress={() => handleLogActivity(activity, activity.category)}>
              <View style={styles.activityHeader}>
                <View style={styles.activityCategoryTag}>
                  <Text style={styles.activityCategoryText}>{activity.category}</Text>
                </View>
                <Text style={styles.activityDuration}>{activity.duration_minutes} min</Text>
              </View>
              <Text style={styles.activityTitle}>{activity.name}</Text>
              <View style={styles.benefitsList}>
                {activity.benefits && activity.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <FontAwesome5 name="check-circle" size={12} color="#4B6D9B" style={styles.benefitIcon} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
                {!activity.benefits && (
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                )}
              </View>
              <LinearGradient
                colors={[activity.color_code || '#64B5F6', (activity.color_code || '#64B5F6') + '30']}
                style={styles.activityGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Card>
          ))
        ) : (
          <Card style={styles.emptyStateCard}>
            <FontAwesome5 name="spa" size={32} color="#4B6D9B" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>No self-care activities available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new activities</Text>
          </Card>
        )}
        
        {/* Recently Logged Activity */}
        {recentlyLogged && (
          <Card style={styles.recentlyLoggedCard}>
            <View style={styles.recentlyLoggedHeader}>
              <Text style={styles.cardTitle}>Recently Completed</Text>
            </View>
            <View style={styles.recentlyLoggedContent}>
              <View style={styles.recentlyLoggedIconContainer}>
                <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.recentlyLoggedInfo}>
                <Text style={styles.recentlyLoggedTitle}>
                  {recentlyLogged.title || recentlyLogged.name}
                </Text>
                <Text style={styles.recentlyLoggedTime}>
                  {new Date(recentlyLogged.loggedAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </Card>
        )}
        
        {/* Create Custom Activity Button */}
        <Button
          label="Create Custom Activity"
          icon="plus"
          variant="primary"
          fullWidth
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        />
        
        {/* Activity Modal */}
        <ActivityModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveCustomActivity}
        />
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2B50',
  },
  subtitle: {
    fontSize: 14,
    color: '#758494',
    marginTop: 4,
  },
  statsContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E4EDFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4B6D9B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6D9B',
  },
  statsLabel: {
    fontSize: 10,
    color: '#758494',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#758494',
    textAlign: 'center',
  },
  errorText: {
    color: '#E57373',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  noAccessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginTop: 20,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 16,
    color: '#758494',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  lockIcon: {
    marginBottom: 12,
  },
  summaryCard: {
    marginBottom: 16,
  },
  moodTrackerCard: {
    marginBottom: 16,
  },
  moodHistoryCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#758494',
    textAlign: 'center',
  },
  moodOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodOption: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedMoodOption: {
    borderColor: '#4B6D9B',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 14,
    color: '#758494',
  },
  selectedMoodLabel: {
    color: '#4B6D9B',
    fontWeight: '500',
  },
  saveMoodButton: {
    marginTop: 8,
  },
  moodHistoryChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  moodHistoryDay: {
    alignItems: 'center',
    width: 36,
  },
  moodHistoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
    height: 30,
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DFE4EA',
    marginBottom: 6,
  },
  activeDayIndicator: {
    backgroundColor: '#4B6D9B',
  },
  moodHistoryDayText: {
    fontSize: 12,
    color: '#758494',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4B6D9B',
    fontWeight: '500',
  },
  quickReliefList: {
    marginBottom: 24,
  },
  quickReliefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReliefIconContainer: {
    marginRight: 16,
    width: 30,
    alignItems: 'center',
  },
  quickReliefTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B50',
  },
  quickReliefDuration: {
    fontSize: 12,
    color: '#758494',
    marginLeft: 12,
  },
  activityCard: {
    marginBottom: 12,
    padding: 16,
    overflow: 'hidden',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityCategoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityCategoryText: {
    fontSize: 12,
    color: '#4B6D9B',
    fontWeight: '500',
  },
  activityDuration: {
    fontSize: 12,
    color: '#758494',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#758494',
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#758494',
  },
  activityGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: '100%',
  },
  emptyStateCard: {
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#758494',
    textAlign: 'center',
  },
  recentlyLoggedCard: {
    marginBottom: 24,
  },
  recentlyLoggedHeader: {
    marginBottom: 8,
  },
  recentlyLoggedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentlyLoggedIconContainer: {
    marginRight: 12,
  },
  recentlyLoggedInfo: {
    flex: 1,
  },
  recentlyLoggedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
  },
  recentlyLoggedTime: {
    fontSize: 14,
    color: '#758494',
    marginTop: 4,
  },
  createButton: {
    marginBottom: 24,
  },
  bottomSpacer: {
    height: 30,
  },
}); 