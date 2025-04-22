import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDatabase } from '../contexts/DatabaseContext';
import Card from './Card';

/**
 * Displays a user's activity streak information
 * @param {Object} props Component props
 * @param {string} props.streakType The type of streak to display ('self_care', 'situation_log', etc.)
 * @param {string} props.title Title for the streak display
 * @param {string} props.subtitle Optional subtitle text
 * @returns {React.ReactElement} Streak display component
 */
export default function StreakDisplay({ streakType, title, subtitle }) {
  const { db, isReady } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isReady) {
      loadStreakData();
    }
  }, [isReady, streakType]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekStreak = await db.getWeekStreak(streakType);
      setStreakData(weekStreak);
    } catch (err) {
      console.error('Error loading streak data:', err);
      setError('Could not load streak data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4B6D9B" />
          <Text style={styles.loadingText}>Loading streak data...</Text>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
      </Card>
    );
  }

  const { currentStreak, longestStreak, activeDays } = streakData || {
    currentStreak: 0,
    longestStreak: 0,
    activeDays: []
  };

  // Sort days to start with Monday (1) and end with Sunday (0)
  const sortedDays = [...activeDays].sort((a, b) => {
    // Convert Sunday (0) to 7 for proper sorting
    const dayA = a.dayNumber === 0 ? 7 : a.dayNumber;
    const dayB = b.dayNumber === 0 ? 7 : b.dayNumber;
    return dayA - dayB;
  });

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title || 'Activity Streak'}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      <View style={styles.streakInfoContainer}>
        <View style={styles.streakMetric}>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.streakMetric}>
          <Text style={styles.streakCount}>{longestStreak}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>
      
      <Text style={styles.weekLabel}>This Week</Text>
      <View style={styles.streaksGrid}>
        {sortedDays.map((day, index) => (
          <View key={index} style={styles.streakDay}>
            <Text style={styles.streakDayLabel}>{day.dayLabel}</Text>
            <View style={[
              styles.streakDayCircle,
              day.isActive && styles.streakDayCompleted
            ]}>
              {day.isActive && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    padding: 10,
  },
  streakInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  streakMetric: {
    alignItems: 'center',
    padding: 8,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B6D9B',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 40,
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  streaksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakDay: {
    alignItems: 'center',
  },
  streakDayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  streakDayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  streakDayCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#43A047',
  },
}); 