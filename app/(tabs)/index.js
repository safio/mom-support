import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DatabaseExample from '../components/DatabaseExample';

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  
  // Get current time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };
  
  // Mood options
  const moods = [
    { id: 'great', emoji: '😊', label: 'Great', color: '#4CAF50' },
    { id: 'good', emoji: '🙂', label: 'Good', color: '#8BC34A' },
    { id: 'okay', emoji: '😐', label: 'Okay', color: '#FFC107' },
    { id: 'sad', emoji: '😔', label: 'Sad', color: '#FF9800' },
    { id: 'stressed', emoji: '😫', label: 'Stressed', color: '#F44336' }
  ];
  
  // Recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'situation',
      title: 'Logged bedtime resistance',
      time: '2 hours ago',
      icon: 'moon',
      iconColor: '#64B5F6'
    },
    {
      id: '2',
      type: 'mood',
      title: 'Logged daily mood as "Good"',
      time: '5 hours ago',
      icon: 'smile',
      iconColor: '#81C784'
    },
    {
      id: '3',
      type: 'guidance',
      title: 'Read "Bedtime Routines" article',
      time: 'Yesterday',
      icon: 'lightbulb',
      iconColor: '#FFB74D' 
    }
  ];
  
  // Inspiring quotes
  const inspiringQuotes = [
    {
      id: '1',
      quote: "There's no way to be a perfect mother, but a million ways to be a good one.",
      author: "Jill Churchill"
    },
    {
      id: '2',
      quote: "Take care of yourself. When you don't sleep, eat crap, don't exercise, and are living off adrenaline for too long, your performance suffers. Your decisions suffer. Your company suffers.",
      author: "Arianna Huffington"
    }
  ];
  
  // Random quote
  const randomQuoteIndex = Math.floor(Math.random() * inspiringQuotes.length);
  const dailyQuote = inspiringQuotes[randomQuoteIndex];
  
  // Guided activities
  const guidedActivities = [
    {
      id: '1',
      title: 'Morning Connection Ritual',
      description: 'Start the day with positive connection',
      duration: '5 min',
      category: 'Bonding',
      icon: 'sun',
      color: '#FF9800'
    },
    {
      id: '2',
      title: 'Calm Down Corner Setup',
      description: 'Create a space for emotional regulation',
      duration: '15 min',
      category: 'Environment',
      icon: 'spa',
      color: '#9C27B0'
    },
    {
      id: '3',
      title: 'Bedtime Wind-Down',
      description: 'Consistent routine for better sleep',
      duration: '10 min',
      category: 'Sleep',
      icon: 'moon',
      color: '#3F51B5'
    }
  ];
  
  const handleSelectMood = (mood) => {
    setSelectedMood(mood.id);
    // Here you would also save the mood in the database
  };
  
  const navigateToScreen = (screen) => {
    router.push(`/(tabs)/${screen}`);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.name}>
              {user?.user_metadata?.full_name || 'Mom'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome5 name="user-circle" size={28} color="#4B6D9B" />
          </TouchableOpacity>
        </View>
        
        {/* Today's Quote */}
        <LinearGradient 
          colors={['#f0f5ff', '#e4edff']} 
          start={{x: 0, y: 0}} 
          end={{x: 1, y: 0}} 
          style={styles.quoteCard}
        >
          <Text style={styles.quoteText}>"{dailyQuote.quote}"</Text>
          <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
        </LinearGradient>
        
        {/* How are you feeling today? */}
        <View style={styles.moodTrackerCard}>
          <Text style={styles.moodQuestion}>How are you feeling today?</Text>
          <View style={styles.moodOptionsContainer}>
            {moods.map((mood) => (
              <TouchableOpacity 
                key={mood.id} 
                style={[
                  styles.moodOption,
                  selectedMood === mood.id && { borderColor: mood.color, borderWidth: 2 }
                ]}
                onPress={() => handleSelectMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.id && { color: mood.color, fontWeight: '600' }
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            style={[
              styles.logMoodButton,
              selectedMood ? styles.logMoodButtonActive : {}
            ]}
            disabled={!selectedMood}
          >
            <Text style={[
              styles.logMoodButtonText,
              selectedMood ? styles.logMoodButtonTextActive : {}
            ]}>
              Log Mood
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('tracker')}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.actionIconContainer}
              >
                <FontAwesome5 name="plus" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Log Situation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('self-care')}
            >
              <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.actionIconContainer}
              >
                <FontAwesome5 name="heart" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Self-Care</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('guidance')}
            >
              <LinearGradient
                colors={['#03A9F4', '#0288D1']}
                style={styles.actionIconContainer}
              >
                <FontAwesome5 name="lightbulb" size={18} color="#fff" solid />
              </LinearGradient>
              <Text style={styles.actionText}>Guidance</Text>
            </TouchableOpacity>
            
            {/* Progress button temporarily disabled */}
            <View style={[styles.actionButton, {opacity: 0.5}]}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.actionIconContainer}
              >
                <FontAwesome5 name="chart-line" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Coming Soon</Text>
            </View>
          </View>
        </View>
        
        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentActivities.map(activity => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: activity.iconColor + '20' }]}>
                <FontAwesome5 name={activity.icon} size={16} color={activity.iconColor} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#CCD0D5" />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Guided Activities */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Guided Activities</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollView}>
            {guidedActivities.map(activity => (
              <TouchableOpacity key={activity.id} style={styles.activityCard}>
                <View style={[styles.activityCardIcon, { backgroundColor: activity.color }]}>
                  <FontAwesome5 name={activity.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.activityCardTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <View style={styles.activityMeta}>
                  <View style={styles.durationTag}>
                    <FontAwesome5 name="clock" size={10} color="#4B6D9B" />
                    <Text style={styles.activityDuration}>{activity.duration}</Text>
                  </View>
                  <Text style={styles.activityCategory}>{activity.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Anonymous CTA */}
        {user?.isAnonymous && (
          <LinearGradient
            colors={['#4B6D9B', '#3A5783']}
            style={styles.ctaContainer}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <Text style={styles.ctaTitle}>Create Your Account</Text>
            <Text style={styles.ctaDescription}>
              Save your data and get personalized recommendations.
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.ctaButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
        
        {/* Spacing at the bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#758494',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2B50',
  },
  profileButton: {
    padding: 6,
  },
  quoteCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteText: {
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: '#445771',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#758494',
    textAlign: 'right',
  },
  moodTrackerCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  moodQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 12,
    textAlign: 'center',
  },
  moodOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEF4',
    width: 60,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#758494',
  },
  logMoodButton: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logMoodButtonActive: {
    backgroundColor: '#4B6D9B',
  },
  logMoodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A5B2C0',
  },
  logMoodButtonTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#445771',
    fontSize: 14,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#758494',
  },
  horizontalScrollView: {
    paddingBottom: 8,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginRight: 12,
    width: width * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activityCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#758494',
    marginBottom: 12,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityDuration: {
    fontSize: 12,
    color: '#4B6D9B',
    fontWeight: '500',
    marginLeft: 4,
  },
  activityCategory: {
    fontSize: 12,
    color: '#758494',
  },
  ctaContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4B6D9B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: '#4B6D9B',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 40,
  },
}); 