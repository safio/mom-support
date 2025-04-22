import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import SituationModal from '../components/SituationModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function TrackerScreen() {
  const { db, checkFeatureAccess, trackFeatureUsage } = useDatabase();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [situations, setSituations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [calendarDays, setCalendarDays] = useState([]);
  const [isLoadingSituations, setIsLoadingSituations] = useState(false);
  const [situationModalVisible, setSituationModalVisible] = useState(false);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    activeDays: [],
    weekComplete: false
  });
  const [loadingStreak, setLoadingStreak] = useState(false);

  // Focus effect to refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkUserAccess();
      loadCategories();
      generateCalendarDays();
      loadSituationsForSelectedDate();
      loadStreakData();
    }, [])
  );

  // Load user's streak data
  const loadStreakData = async () => {
    try {
      setLoadingStreak(true);
      // Get streak data for situation tracking
      const streak = await db.getWeekStreak('situation_tracking');
      setStreakData(streak);
    } catch (err) {
      console.error('Error loading streak data:', err);
      // Use default/fallback streak data
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        activeDays: [],
        weekComplete: false
      });
    } finally {
      setLoadingStreak(false);
    }
  };

  // Check if user has access to tracking features
  const checkUserAccess = async () => {
    try {
      const hasBasicTracking = await checkFeatureAccess('basic_tracking');
      setHasAccess(hasBasicTracking);
      
      if (hasBasicTracking) {
        trackFeatureUsage('view_tracker');
      }
    } catch (err) {
      console.error('Error checking feature access:', err);
      setError('Unable to check feature access');
    }
  };

  // Load situation categories from database
  const loadCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await db.getSituationCategories();
      setCategories(fetchedCategories);
      setError(null);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load situation categories');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    setCurrentWeekStart(prevWeekStart);
    generateCalendarDays(prevWeekStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    setCurrentWeekStart(nextWeekStart);
    generateCalendarDays(nextWeekStart);
  };

  // Get the start of the week (Sunday) for a given date
  function getWeekStart(date) {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day);
    return result;
  }

  // Generate calendar days for the current week
  const generateCalendarDays = (startDate = currentWeekStart) => {
    const days = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    setCalendarDays(days);
  };

  // Effect to generate calendar days when component mounts
  useEffect(() => {
    generateCalendarDays();
  }, []);

  // Effect to load situations when selected date changes
  useEffect(() => {
    loadSituationsForSelectedDate();
  }, [selectedDate]);

  // Load situations for the selected date
  const loadSituationsForSelectedDate = async () => {
    if (!hasAccess) return;
    
    try {
      setIsLoadingSituations(true);
      
      // Format date as YYYY-MM-DD for database query
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Use the same date for both start and end to get situations for a specific date
      const fetchedSituations = await db.getSituations(dateString, dateString);
      
      setSituations(fetchedSituations);
      setError(null);
      
      // If it's today's date and we found situations, update the streak
      if (isToday(selectedDate) && fetchedSituations.length > 0) {
        // Update streak for today's activity
        await db.updateStreak('situation_tracking', selectedDate);
        // Refresh streak data
        loadStreakData();
      }
    } catch (err) {
      console.error('Error loading situations:', err);
      setError('Failed to load situations for selected date');
    } finally {
      setIsLoadingSituations(false);
    }
  };

  // Handle date selection in calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Format date for display (e.g., "Mon 12")
  const formatCalendarDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate()
    };
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if a date is selected
  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  // Log a new situation
  const logNewSituation = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    
    const normalizedSelectedDate = new Date(selectedDate);
    normalizedSelectedDate.setHours(0, 0, 0, 0); // Normalize selected date

    // Check if selected date is in the future
    if (normalizedSelectedDate > today) {
      Alert.alert(
        "Cannot Log Future Situations",
        "You can only log situations for today or past dates."
      );
      return; // Stop the function
    }

    if (hasAccess) {
      setSituationModalVisible(true);
    } else {
      Alert.alert('Feature Locked', 'You need to create an account to track situations.');
    }
  };

  // Handle new situation saved
  const handleSituationSaved = async (newSituation) => {
    // Reload situations for the selected date
    await loadSituationsForSelectedDate();
    
    // If the situation is for today, update the streak
    const situationDate = newSituation?.situation_date ? new Date(newSituation.situation_date) : new Date();
    
    if (isToday(situationDate)) {
      try {
        // Update streak for today's activity
        await db.updateStreak('situation_tracking', situationDate);
        // Refresh streak data
        await loadStreakData();
      } catch (err) {
        console.error('Error updating streak:', err);
      }
    }
  };

  // Generate day abbreviation (M, T, W, etc.)
  const getDayAbbreviation = (dayIndex) => {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex];
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B6D9B" />
        <Text style={styles.loadingText}>Loading tracker...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && !hasAccess) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={checkUserAccess} />
      </SafeAreaView>
    );
  }

  // Render access restricted state
  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tracker</Text>
            <Text style={styles.headerSubtitle}>Log and track daily situations</Text>
          </View>
          
          <Card style={styles.lockCard} gradient={true} gradientColors={['#EDF0F7', '#E2E8F4']}>
            <FontAwesome5 name="lock" size={36} color="#4B6D9B" style={styles.lockIcon} />
            <Text style={styles.lockTitle}>Feature Locked</Text>
            <Text style={styles.lockDescription}>
              Create an account to track challenging situations and get personalized guidance.
            </Text>
            <Button
              label="Sign Up Now"
              variant="primary"
              style={styles.lockButton}
            />
          </Card>
          
          <Text style={styles.featuresSectionTitle}>With Situation Tracker you can:</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <FontAwesome5 name="clipboard-list" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureCardTitle}>Log Daily Challenges</Text>
              <Text style={styles.featureCardDescription}>
                Keep track of situations that are difficult to manage
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconCircle, { backgroundColor: '#03A9F4' }]}>
                <FontAwesome5 name="chart-line" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureCardTitle}>Identify Patterns</Text>
              <Text style={styles.featureCardDescription}>
                Discover trends in behavior and triggers
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconCircle, { backgroundColor: '#FF9800' }]}>
                <FontAwesome5 name="lightbulb" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureCardTitle}>Get Tailored Guidance</Text>
              <Text style={styles.featureCardDescription}>
                Receive personalized recommendations based on your logs
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render main tracker screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tracker</Text>
          <Text style={styles.headerSubtitle}>Log and track daily situations</Text>
        </View>
        
        {/* Streaks Card */}
        <Card style={styles.streaksCard}>
          <View style={styles.streaksHeader}>
            <Text style={styles.streaksTitle}>Logging Streak</Text>
            <Text style={styles.streaksDays}>{streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''}</Text>
          </View>
          
          {loadingStreak ? (
            <ActivityIndicator size="small" color="#4B6D9B" style={{marginVertical: 20}} />
          ) : (
            <View style={styles.streaksGrid}>
              {Array.from({ length: 7 }, (_, i) => {
                const activeDayInfo = streakData.activeDays ? 
                  streakData.activeDays.find(day => day.dayNumber === i) : null;
                const isActive = activeDayInfo?.isActive || false;
                
                return (
                  <View key={i} style={styles.streakDay}>
                    <Text style={styles.streakDayLabel}>
                      {getDayAbbreviation(i)}
                    </Text>
                    <View style={[
                      styles.streakDayCircle,
                      isActive && styles.streakDayCompleted
                    ]}>
                      {isActive && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNumber}>{streakData.currentStreak || 0}</Text>
              <Text style={styles.streakStatLabel}>Current</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNumber}>{streakData.longestStreak || 0}</Text>
              <Text style={styles.streakStatLabel}>Longest</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNumber}>
                {streakData.activeDays ? streakData.activeDays.filter(d => d.isActive).length : 0}
              </Text>
              <Text style={styles.streakStatLabel}>Days This Week</Text>
            </View>
          </View>
        </Card>
        
        {/* Calendar Section */}
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <View style={styles.calendarControls}>
              <TouchableOpacity onPress={goToPreviousWeek} style={styles.calendarNavButton}>
                <FontAwesome5 name="chevron-left" size={14} color="#4B6D9B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={goToNextWeek} style={styles.calendarNavButton}>
                <FontAwesome5 name="chevron-right" size={14} color="#4B6D9B" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const { day, date: dayNumber } = formatCalendarDate(date);
              const today = isToday(date);
              const selected = isSelected(date);
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.calendarDay,
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dayName,
                    selected && styles.selectedDayText
                  ]}>
                    {day}
                  </Text>
                  <View style={[
                    styles.dateCircle,
                    today && styles.todayCircle,
                    selected && styles.selectedDateCircle
                  ]}>
                    <Text style={[
                      styles.dateNumber,
                      today && styles.todayText,
                      selected && styles.selectedDateText
                    ]}>
                      {dayNumber}
                    </Text>
                  </View>
                  {situations.filter(s => {
                    // Check if situation date matches this calendar date
                    try {
                      if (!s.situation_date) return false;
                      const situationDate = new Date(s.situation_date);
                      return situationDate.toDateString() === date.toDateString();
                    } catch (err) {
                      return false;
                    }
                  }).length > 0 && (
                    <View style={[
                      styles.situationIndicator,
                      selected && styles.selectedSituationIndicator
                    ]}>
                      <Text style={[
                        styles.situationIndicatorText,
                        selected && styles.selectedSituationIndicatorText
                      ]}>
                        {situations.filter(s => {
                          try {
                            if (!s.situation_date) return false;
                            const situationDate = new Date(s.situation_date);
                            return situationDate.toDateString() === date.toDateString();
                          } catch (err) {
                            return false;
                          }
                        }).length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
        
        {/* Situations for Selected Date */}
        <View style={styles.situationsContainer}>
          <View style={styles.situationsHeader}>
            <Text style={styles.situationsTitle}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.situationsCount}>
              {situations.length} {situations.length === 1 ? 'situation' : 'situations'}
            </Text>
          </View>
          
          {/* Log New Situation Button */}
          <TouchableOpacity style={styles.logSituationButton} onPress={logNewSituation}>
            <LinearGradient
              colors={['#4B6D9B', '#3A5783']}
              style={styles.logSituationGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <FontAwesome5 name="plus" size={16} color="#fff" />
              <Text style={styles.logSituationText}>Log New Situation</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {isLoadingSituations ? (
            <ActivityIndicator size="small" color="#4B6D9B" style={styles.loadingIndicator} />
          ) : situations.length === 0 ? (
            <Card style={styles.emptySituationsCard} gradient={true} gradientColors={['#f8faff', '#edf2ff']}>
              <FontAwesome5 name="calendar-plus" size={50} color="#DCE7F9" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No situations tracked</Text>
              <Text style={styles.emptyText}>
                Track your first situation for this day
              </Text>
              <Button 
                label="Add Situation"
                onPress={logNewSituation}
                icon="plus"
                variant="primary"
                style={styles.emptyStateButton}
              />
            </Card>
          ) : (
            <View style={styles.situationsList}>
              {situations.map((situation) => (
                <Card 
                  key={situation.id} 
                  style={[
                    styles.situationCard,
                    { borderLeftColor: getCategoryColor(situation.category_id) }
                  ]}
                  onPress={() => Alert.alert('View Situation', 'View details for: ' + situation.title)}
                >
                  <View style={styles.situationHeader}>
                    <View style={styles.categoryBadge}>
                      <FontAwesome5 
                        name={getCategoryIcon(situation.category_id)} 
                        size={12} 
                        color={getCategoryColor(situation.category_id)}
                        solid 
                      />
                      <Text style={[
                        styles.categoryText, 
                        { color: getCategoryColor(situation.category_id) }
                      ]}>
                        {getCategoryName(situation.category_id)}
                      </Text>
                    </View>
                    <Text style={styles.situationTime}>
                      {new Date(situation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  
                  <Text style={styles.situationTitle}>{situation.title}</Text>
                  <Text style={styles.situationDescription} numberOfLines={2}>{situation.description}</Text>
                  
                  <View style={styles.situationMetadata}>
                    {situation.emotion && (
                      <View style={styles.emotionContainer}>
                        <FontAwesome5 name="heart" size={12} color="#E57373" style={styles.emotionIcon} />
                        <Text style={styles.emotionText}>{situation.emotion}</Text>
                      </View>
                    )}
                    
                    {situation.intensity && (
                      <View style={styles.intensityContainer}>
                        <Text style={styles.intensityLabel}>Intensity:</Text>
                        <View style={styles.intensityDots}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <View 
                              key={i} 
                              style={[
                                styles.intensityDot,
                                i < situation.intensity && { backgroundColor: getIntensityColor(situation.intensity) }
                              ]} 
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <LinearGradient
                    colors={[getCategoryColor(situation.category_id), getCategoryColor(situation.category_id) + '10']}
                    style={styles.situationGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </Card>
              ))}
            </View>
          )}
        </View>
        
        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={logNewSituation}>
        <LinearGradient
          colors={['#4B6D9B', '#3A5783']}
          style={styles.fabGradient}
        >
          <FontAwesome5 name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Situation Modal */}
      <SituationModal 
        visible={situationModalVisible} 
        onClose={() => setSituationModalVisible(false)}
        onSave={handleSituationSaved}
      />
    </SafeAreaView>
  );
  
  // Helper function to get category name by ID
  function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  }
  
  // Helper function to get category color by ID
  function getCategoryColor(categoryId) {
    const colors = {
      1: '#FF9800', // Sleep
      2: '#03A9F4', // Eating
      3: '#E91E63', // Emotions
      4: '#4CAF50', // Behavior
      5: '#9C27B0', // Social
      6: '#3F51B5', // Other
    };
    
    // Default color if category not found
    return colors[categoryId] || '#607D8B';
  }
  
  // Helper function to get category icon by ID
  function getCategoryIcon(categoryId) {
    const icons = {
      1: 'moon',        // Sleep
      2: 'utensils',    // Eating
      3: 'smile',       // Emotions
      4: 'child',       // Behavior
      5: 'users',       // Social
      6: 'question',    // Other
    };
    
    // Default icon if category not found
    return icons[categoryId] || 'tag';
  }

  // Helper function to get intensity color
  function getIntensityColor(intensity) {
    if (intensity <= 2) return '#4CAF50'; // Low - Green
    if (intensity <= 4) return '#FFC107'; // Medium - Yellow
    return '#F44336'; // High - Red
  }

  useEffect(() => {
    if (!situationModalVisible) {
      // Refresh data when modal is closed
      loadSituationsForSelectedDate();
      loadStreakData();
    }
  }, [situationModalVisible]);
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B6D9B',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#758494',
  },
  calendarCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
  },
  calendarControls: {
    flexDirection: 'row',
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    width: (width - 40 - 32) / 7, // Adjust for container padding and margin
  },
  dayName: {
    fontSize: 12,
    color: '#758494',
    marginBottom: 8,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#445771',
  },
  todayCircle: {
    backgroundColor: '#ECF4FF',
    borderWidth: 1,
    borderColor: '#4B6D9B',
  },
  todayText: {
    color: '#4B6D9B',
    fontWeight: '600',
  },
  selectedDateCircle: {
    backgroundColor: '#4B6D9B',
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#4B6D9B',
    fontWeight: '600',
  },
  situationIndicator: {
    marginTop: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  situationIndicatorText: {
    fontSize: 10,
    color: '#4B6D9B',
    fontWeight: '500',
  },
  selectedSituationIndicator: {
    backgroundColor: '#304F80',
  },
  selectedSituationIndicatorText: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 2,
  },
  sectionDate: {
    fontSize: 14,
    color: '#758494',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6D9B',
  },
  statsLabel: {
    fontSize: 10,
    color: '#758494',
  },
  logSituationButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logSituationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logSituationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  situationsContainer: {
    paddingHorizontal: 20,
  },
  emptySituationsCard: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#758494',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  situationsList: {
    marginBottom: 16,
  },
  situationCard: {
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#4B6D9B',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  situationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  situationTime: {
    fontSize: 12,
    color: '#758494',
  },
  situationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 8,
  },
  situationDescription: {
    fontSize: 14,
    color: '#758494',
    lineHeight: 20,
    marginBottom: 12,
  },
  situationMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  emotionIcon: {
    marginRight: 6,
  },
  emotionText: {
    fontSize: 13,
    color: '#758494',
    fontWeight: '500',
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityLabel: {
    fontSize: 13,
    color: '#758494',
    marginRight: 6,
  },
  intensityDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8EEF4',
    marginRight: 4,
  },
  situationGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  // Access Restricted UI
  lockCard: {
    margin: 20,
    marginTop: 10,
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  lockIcon: {
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 8,
  },
  lockDescription: {
    fontSize: 16,
    color: '#445771',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  lockButton: {
    minWidth: 200,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B50',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B6D9B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 6,
  },
  featureCardDescription: {
    fontSize: 14,
    color: '#758494',
    lineHeight: 20,
  },
  streaksCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
  },
  streaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streaksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
  },
  streaksDays: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B6D9B',
  },
  streaksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  streakDay: {
    alignItems: 'center',
  },
  streakDayLabel: {
    fontSize: 12,
    color: '#758494',
    marginBottom: 8,
  },
  streakDayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE7F9',
  },
  streakDayCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 2,
  },
  streakStatLabel: {
    fontSize: 12,
    color: '#758494',
  },
  streakDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#DCE7F9',
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  situationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  situationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 2,
  },
  situationsCount: {
    fontSize: 14,
    color: '#758494',
  },
}); 