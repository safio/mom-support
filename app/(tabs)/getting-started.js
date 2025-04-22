import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function GettingStarted() {
  const { user, updateProfile } = useAuth();
  
  const handleGetStarted = async () => {
    try {
      if (user?.isAnonymous) {
        // Mark that this user has viewed the getting started screen
        await SecureStore.setItemAsync('anonymousUserHasViewedGetStarted', 'true');
        
        // If using updateProfile for anonymous users
        await updateProfile({ hasViewedGetStarted: true });
      }
      
      // Navigate to the home screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving getting started status:', error);
      router.replace('/(tabs)');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Mom Support</Text>
        {user?.isAnonymous && (
          <Text style={styles.subtitle}>You're using the app anonymously</Text>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <Text style={styles.paragraph}>
          Mom Support is an anonymous platform designed to help mothers track daily parenting challenges, 
          receive personalized guidance, and practice positive parenting techniques - all with 
          complete privacy.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>📝 Daily Situation Tracking</Text>
          <Text style={styles.featureDescription}>
            Easily log common parenting challenges and situations
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>🧠 Immediate Guidance</Text>
          <Text style={styles.featureDescription}>
            Get contextual advice based on specific situations
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>🧘‍♀️ Self-Care Focus</Text>
          <Text style={styles.featureDescription}>
            Access integrated resources to support your wellbeing
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>📊 Progress Insights</Text>
          <Text style={styles.featureDescription}>
            Track patterns and improvements over time
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Privacy</Text>
        <Text style={styles.paragraph}>
          Mom Support is built with privacy as the top priority. We don't collect any personal 
          identifiers or information. All data is stored locally on your device.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleGetStarted}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  featureItem: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4B6D9B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 