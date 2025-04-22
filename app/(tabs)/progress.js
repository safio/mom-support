import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';

export default function ProgressScreen() {
  // Redirect to home screen as the progress tab is temporarily disabled
  return <Redirect href="/(tabs)" />;
  
  // The rest of the code remains intact but won't be executed due to the redirect
  const { db, isReady, checkFeatureAccess } = useDatabase();
  const { isAuthenticated } = useAuth();
  
  const [activeTimeframe, setActiveTimeframe] = useState('week');
  const [activeStat, setActiveStat] = useState('situations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Data states
  const [situationData, setSituationData] = useState({});
  const [moodData, setMoodData] = useState({});
  const [selfCareData, setSelfCareData] = useState({});
  const [insights, setInsights] = useState([]);
  const [wellnessSummary, setWellnessSummary] = useState(null);
  
  // Timeframe options
  const timeframes = [
    { id: 'week', label: 'Week', days: 7 },
    { id: 'month', label: 'Month', days: 30 },
    { id: '3months', label: '3 Months', days: 90 },
  ];
  
  // Stat type options
  const statTypes = [
    { id: 'situations', label: 'Situations', icon: 'calendar-check-o' },
    { id: 'moods', label: 'Moods', icon: 'smile-o' },
    { id: 'selfcare', label: 'Self-Care', icon: 'heart' },
  ];
  
  // Check access and load data when component mounts
  useEffect(() => {
    if (isReady) {
      checkAccessAndLoadData();
    }
  }, [isReady, activeTimeframe]);
  
  // Check feature access and load data
  const checkAccessAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has access to progress features
      const canAccessBasic = await checkFeatureAccess('basic_tracking');
      setHasAccess(canAccessBasic);
      
      if (canAccessBasic) {
        await loadData();
      }
    } catch (err) {
      console.error('Error in progress access check:', err);
      setError('Failed to check access permissions.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load data based on selected timeframe
  const loadData = async () => {
    try {
      const selectedTimeframe = timeframes.find(t => t.id === activeTimeframe);
      const days = selectedTimeframe.days;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const endDateStr = endDate.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Fetch wellness summary
      const summary = await db.getWellnessSummary(startDateStr, endDateStr);
      setWellnessSummary(summary);
      
      // Fetch situation data
      const situations = await db.getSituations(startDate, endDate);
      const processedSituationData = processSituationData(situations, days);
      setSituationData(processedSituationData);
      
      // Fetch mood data
      const moods = await db.getMoodHistory(startDateStr, endDateStr);
      const processedMoodData = processMoodData(moods, days);
      setMoodData(processedMoodData);
      
      // Fetch self-care data
      const selfCareLogs = await db.getSelfCareLogs(startDateStr, endDateStr);
      const processedSelfCareData = processSelfCareData(selfCareLogs, days);
      setSelfCareData(processedSelfCareData);
      
      // Fetch insights
      const insightData = await db.getInsights();
      setInsights(insightData.length > 0 ? insightData : generateDefaultInsights(summary));
      
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Process situation data
  const processSituationData = (situations, days) => {
    // Create date bins for the selected timeframe
    const dateLabels = {};
    const result = { week: [], month: [] };
    
    // Generate date bins for a week
    if (days <= 7) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dayIndex = date.getDay();
        const dayName = dayNames[dayIndex];
        const dateStr = date.toISOString().split('T')[0];
        
        dateLabels[dateStr] = dayName;
        result.week.push({
          day: dayName,
          date: dateStr,
          count: 0,
          categories: { behavior: 0, sleep: 0, positive: 0, other: 0 }
        });
      }
      
      // Count situations by date and category
      situations.forEach(situation => {
        const dateStr = situation.situation_date;
        const dayData = result.week.find(d => d.date === dateStr);
        
        if (dayData) {
          dayData.count++;
          
          // Map category to one of our predefined categories
          const category = mapCategoryName(situation.situation_categories?.name);
          if (dayData.categories[category] !== undefined) {
            dayData.categories[category]++;
          } else {
            dayData.categories.other++;
          }
        }
      });
    } else {
      // For month view, group by week
      const weeksCount = Math.ceil(days / 7);
      for (let i = 0; i < weeksCount; i++) {
        result.month.push({
          week: `Week ${i + 1}`,
          count: 0,
          categories: { behavior: 0, sleep: 0, positive: 0, other: 0 }
        });
      }
      
      // Count situations by week
      situations.forEach(situation => {
        const situationDate = new Date(situation.situation_date);
        const today = new Date();
        const diffTime = Math.abs(today - situationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Determine which week this falls into
        const weekIndex = Math.min(Math.floor(diffDays / 7), weeksCount - 1);
        const weekData = result.month[weekIndex];
        
        if (weekData) {
          weekData.count++;
          
          // Map category to one of our predefined categories
          const category = mapCategoryName(situation.situation_categories?.name);
          if (weekData.categories[category] !== undefined) {
            weekData.categories[category]++;
          } else {
            weekData.categories.other++;
          }
        }
      });
      
      // Reverse the order so most recent week is last
      result.month.reverse();
    }
    
    return result;
  };
  
  // Map situation category names to our chart categories
  const mapCategoryName = (categoryName = '') => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('behavior') || lowerName.includes('tantrum')) {
      return 'behavior';
    } else if (lowerName.includes('sleep') || lowerName.includes('bedtime')) {
      return 'sleep';
    } else if (lowerName.includes('positive') || lowerName.includes('milestone')) {
      return 'positive';
    } else {
      return 'other';
    }
  };
  
  // Process mood data
  const processMoodData = (moods, days) => {
    const result = { week: [] };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Create entries for each day
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      const dateStr = date.toISOString().split('T')[0];
      
      result.week.push({
        day: dayName,
        date: dateStr,
        moods: { great: 0, good: 0, okay: 0, stressed: 0, exhausted: 0, other: 0 }
      });
    }
    
    // Map mood entries to days
    moods.forEach(mood => {
      const dayData = result.week.find(d => d.date === mood.mood_date);
      if (dayData) {
        // Map mood type to chart categories
        const moodType = mapMoodType(mood.mood_type);
        if (dayData.moods[moodType] !== undefined) {
          dayData.moods[moodType] = 1; // We only show one mood per day
        } else {
          dayData.moods.other = 1;
        }
      }
    });
    
    return result;
  };
  
  // Map mood types to our chart categories
  const mapMoodType = (moodType = '') => {
    const lowerMood = moodType.toLowerCase();
    if (lowerMood.includes('great') || lowerMood.includes('positive')) {
      return 'great';
    } else if (lowerMood.includes('good')) {
      return 'good';
    } else if (lowerMood.includes('okay') || lowerMood.includes('neutral')) {
      return 'okay';
    } else if (lowerMood.includes('stress') || lowerMood.includes('bad')) {
      return 'stressed';
    } else if (lowerMood.includes('exhaust') || lowerMood.includes('terrible') || lowerMood.includes('negative')) {
      return 'exhausted';
    } else {
      return 'other';
    }
  };
  
  // Process self-care data
  const processSelfCareData = (selfCareLogs, days) => {
    const result = { week: [] };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Create entries for each day
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      const dateStr = date.toISOString().split('T')[0];
      
      result.week.push({
        day: dayName,
        date: dateStr,
        minutes: 0
      });
    }
    
    // Sum up self-care minutes by day
    selfCareLogs.forEach(log => {
      const dayData = result.week.find(d => d.date === log.log_date);
      if (dayData) {
        dayData.minutes += log.duration_minutes || 0;
      }
    });
    
    return result;
  };
  
  // Generate default insights if none from database
  const generateDefaultInsights = (summary) => {
    const defaultInsights = [];
    
    if (summary && summary.positiveMoodPercentage >= 70) {
      defaultInsights.push({
        id: 'auto-1',
        title: 'Positive Mood Pattern',
        description: `You've reported positive moods ${summary.positiveMoodPercentage}% of the time this period. Great job!`,
        category: 'moods'
      });
    } else if (summary && summary.positiveMoodPercentage < 50 && summary.totalMoodEntries > 0) {
      defaultInsights.push({
        id: 'auto-2',
        title: 'Mood Improvement Opportunity',
        description: 'Your mood tracker shows more challenging days recently. Consider adding more self-care activities.',
        category: 'moods'
      });
    }
    
    if (summary && summary.totalSelfCareMinutes > 60) {
      defaultInsights.push({
        id: 'auto-3',
        title: 'Self-Care Commitment',
        description: `You've dedicated ${summary.totalSelfCareMinutes} minutes to self-care this period. Keep it up!`,
        category: 'selfcare'
      });
    } else {
      defaultInsights.push({
        id: 'auto-4',
        title: 'Self-Care Reminder',
        description: 'Even 5-10 minutes of self-care daily can significantly improve your wellbeing.',
        category: 'selfcare'
      });
    }
    
    return defaultInsights;
  };
  
  // Calculate max values for chart scaling
  const getMaxValue = () => {
    if (activeStat === 'situations') {
      const data = getCurrentData();
      return Math.max(...data.map(item => item.count)) || 5;
    } else if (activeStat === 'moods') {
      return 1; // For moods we're just showing one mood per day
    } else {
      const data = getCurrentData();
      return Math.max(...data.map(item => item.minutes)) || 60;
    }
  };
  
  // Category/mood colors
  const categoryColors = {
    behavior: '#FFA726',
    sleep: '#5C6BC0',
    positive: '#4CAF50',
    other: '#9E9E9E',
    great: '#4CAF50',
    good: '#8BC34A',
    okay: '#FFC107',
    stressed: '#F44336'
  };
  
  // Get data for currently selected stat and timeframe
  const getCurrentData = () => {
    if (activeStat === 'situations') {
      return situationData[activeTimeframe] || [];
    } else if (activeStat === 'moods') {
      return moodData.week || [];
    } else {
      return selfCareData.week || [];
    }
  };
  
  // Calculate height for bar chart
  const calculateBarHeight = (value) => {
    const maxValue = getMaxValue();
    const maxHeight = 150; // maximum bar height in pixels
    return value && maxValue ? (value / maxValue) * maxHeight : 0;
  };
  
  // Get label for chart X-axis
  const getXLabel = (item) => {
    if (activeTimeframe === 'week') {
      return item.day;
    } else {
      return item.week;
    }
  };
  
  // Retry loading data
  const handleRetry = () => {
    checkAccessAndLoadData();
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframeId) => {
    setActiveTimeframe(timeframeId);
  };
  
  // Render chart based on selected stat type
  const renderChart = () => {
    const data = getCurrentData();
    
    if (!data || data.length === 0) {
  return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>No data available for this time period.</Text>
        </View>
      );
    }
    
    if (activeStat === 'situations') {
      return (
        <View style={styles.chartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barContainer}>
                {/* Stacked bar chart for categories */}
                {Object.entries(item.categories).map(([category, count], catIndex) => (
                  count > 0 ? (
                    <View
                      key={catIndex}
                      style={[
                        styles.barSegment,
                        {
                          height: calculateBarHeight(count),
                          backgroundColor: categoryColors[category],
                        },
                      ]}
                    />
                  ) : null
                ))}
              </View>
              <Text style={styles.barLabel}>{getXLabel(item)}</Text>
            </View>
          ))}
        </View>
      );
    } else if (activeStat === 'moods') {
      return (
        <View style={styles.chartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.moodContainer}>
              {Object.entries(item.moods).some(([mood, value]) => value > 0) ? (
                Object.entries(item.moods).map(([mood, value], moodIndex) => {
                  if (value > 0) {
                    return (
                      <View 
                        key={moodIndex}
                        style={[
                          styles.moodIndicator,
                          { backgroundColor: categoryColors[mood] }
                        ]}
                      />
                    );
                  }
                  return null;
                })
              ) : (
                <View style={styles.emptyMood} />
              )}
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      );
    } else {
      return (
        <View style={styles.chartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: calculateBarHeight(item.minutes),
                      backgroundColor: '#4B6D9B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      );
    }
  };
  
  // Render chart legend
  const renderLegend = () => {
    if (activeStat === 'situations') {
      return (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.behavior }]} />
            <Text style={styles.legendText}>Behavior</Text>
            </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.sleep }]} />
            <Text style={styles.legendText}>Sleep</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.positive }]} />
            <Text style={styles.legendText}>Positive</Text>
            </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.other }]} />
            <Text style={styles.legendText}>Other</Text>
          </View>
        </View>
      );
    } else if (activeStat === 'moods') {
      return (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.great }]} />
            <Text style={styles.legendText}>Great</Text>
          </View>
              <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.good }]} />
            <Text style={styles.legendText}>Good</Text>
              </View>
              <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.okay }]} />
                <Text style={styles.legendText}>Okay</Text>
              </View>
              <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: categoryColors.stressed }]} />
                <Text style={styles.legendText}>Stressed</Text>
              </View>
        </View>
      );
    } else {
      return (
        <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4B6D9B' }]} />
            <Text style={styles.legendText}>Minutes of Self-Care</Text>
          </View>
        </View>
      );
    }
  };
  
  // Render wellness summary cards
  const renderWellnessSummary = () => {
    if (!wellnessSummary) return null;
    
    return (
      <LinearGradient
        colors={['#4B6D9B', '#3A5783']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.summaryContainer}
      >
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{wellnessSummary.positiveMoodPercentage}%</Text>
            <Text style={styles.summaryLabel}>Positive{'\n'}Moods</Text>
        </View>
        
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{wellnessSummary.selfCareDays}</Text>
            <Text style={styles.summaryLabel}>Days with{'\n'}Self-Care</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{wellnessSummary.totalSelfCareMinutes}</Text>
            <Text style={styles.summaryLabel}>Total{'\n'}Minutes</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4B6D9B" />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }
  
  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // No access state
  if (!hasAccess) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.noAccessText}>
          {isAuthenticated 
            ? "You don't have access to this feature with your current subscription."
            : "Please log in to access all features."}
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress & Insights</Text>
        <Text style={styles.subtitle}>Track your parenting journey</Text>
                </View>
      
      {/* Wellness Summary */}
      {renderWellnessSummary()}
      
      {/* Selection Tabs */}
      <View style={styles.tabsContainer}>
        {statTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.tabButton,
              activeStat === type.id && styles.activeTabButton,
            ]}
            onPress={() => setActiveStat(type.id)}
          >
            <FontAwesome
              name={type.icon}
              size={20}
              color={activeStat === type.id ? '#FFFFFF' : '#4B6D9B'}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeStat === type.id && styles.activeTabText,
              ]}
            >
              {type.label}
            </Text>
              </TouchableOpacity>
            ))}
          </View>
      
      {/* Chart Container */}
      <View style={styles.chartSection}>
        <View style={styles.timeframeContainer}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.id}
              style={[
                styles.timeframeButton,
                activeTimeframe === timeframe.id && styles.activeTimeframeButton,
              ]}
              onPress={() => handleTimeframeChange(timeframe.id)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  activeTimeframe === timeframe.id && styles.activeTimeframeText,
                ]}
              >
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {renderChart()}
        {renderLegend()}
      </View>
      
      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insights</Text>
        {insights.length > 0 ? (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
              {insight.category && (
                <View style={[
                  styles.insightCategory,
                  {backgroundColor: getCategoryColor(insight.category)}
                ]}>
                  <FontAwesome
                    name={getCategoryIcon(insight.category)}
                    size={18}
                    color="#FFFFFF"
                    style={{marginBottom: 4}}
                  />
                  <Text style={styles.insightCategoryText}>
                    {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyInsights}>
            Continue tracking to receive personalized insights.
          </Text>
        )}
        </View>
      
      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#758494',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#758494',
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4B6D9B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noAccessText: {
    fontSize: 16,
    color: '#758494',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTabButton: {
    backgroundColor: '#4B6D9B',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    color: '#4B6D9B',
    fontWeight: '600',
    fontSize: 15,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTimeframeButton: {
    backgroundColor: '#4B6D9B',
  },
  timeframeText: {
    color: '#4B6D9B',
    fontWeight: '600',
    fontSize: 15,
  },
  activeTimeframeText: {
    color: '#FFFFFF',
  },
  chartHeader: {
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#758494',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 8,
    paddingBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 30,
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#4B6D9B',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barSegment: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#758494',
    fontWeight: '500',
  },
  moodContainer: {
    alignItems: 'center',
    flex: 1,
    height: 150,
    justifyContent: 'flex-end',
  },
  moodIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    margin: 2,
  },
  emptyMood: {
    height: 20,
  },
  emptyChartContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#758494',
    fontSize: 14,
    fontStyle: 'italic',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  insightContent: {
    flex: 1,
    padding: 16,
  },
  insightCategory: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightCategoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#758494',
    lineHeight: 20,
  },
  emptyInsights: {
    fontSize: 14,
    color: '#758494',
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 20,
    padding: 16,
  },
  bottomSpacer: {
    height: 40,
  },
}); 

// Helper function to get appropriate icon for insight category
function getCategoryIcon(category) {
  switch (category) {
    case 'sleep': return 'moon-o';
    case 'behavior': return 'exclamation-circle';
    case 'moods': return 'smile-o';
    case 'selfcare': return 'heart';
    default: return 'lightbulb-o';
  }
}

// Helper function to get color for insight category
function getCategoryColor(category) {
  switch (category) {
    case 'sleep': return '#5C6BC0';
    case 'behavior': return '#FFA726';
    case 'moods': return '#4CAF50';
    case 'selfcare': return '#E91E63';
    default: return '#4B6D9B';
  }
} 