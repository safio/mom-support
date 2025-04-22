import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
// Adjusted paths for context assuming this file is now at app/(subscription)/index.js
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns'; // Ensure date-fns is imported

export default function SubscribeScreen() {
  const { db, isReady } = useDatabase();
  const { user } = useAuth(); // Use 'user' from useAuth
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available subscription plans
  const loadPlans = useCallback(async () => {
    if (!db || !isReady) return;
    setLoadingPlans(true);
    setError(null);
    try {
      const fetchedPlans = await db.getSubscriptionPlans();
      fetchedPlans.sort((a, b) => {
        if (a.interval === 'year' && b.interval !== 'year') return -1;
        if (a.interval !== 'year' && b.interval === 'year') return 1;
        return 0;
      });
      setPlans(fetchedPlans);
    } catch (err) {
      console.error("Error loading plans:", err);
      setError('Failed to load subscription plans. Please check your connection and try again.');
    } finally {
      setLoadingPlans(false);
    }
  }, [db, isReady]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    handleConfirmSubscription(plan);
  };

  const handleConfirmSubscription = async (plan) => {
    // Use 'user' from useAuth context
    if (!plan || !user) {
      Alert.alert("Error", "Cannot subscribe. User or plan details missing.");
      return;
    }
    setIsSubscribing(true);
    setError(null);
    try {
      console.log(`Attempting to subscribe user ${user.id} to plan ${plan.id}`);
      await db.mockActivateSubscription(plan.id);
      Alert.alert(
        "Subscription Successful!", 
        `You have successfully subscribed to the ${plan.name} plan.`,
        [
          {
            text: "OK",
            // Navigate back to the main tabs screen group
            onPress: () => router.replace('/(tabs)/') 
          }
        ]
      );
      setSelectedPlan(null);
    } catch (err) {
      console.error("Error during mock subscription:", err);
      setError(`Failed to subscribe: ${err.message || 'Please try again.'}`);
      Alert.alert("Subscription Failed", `There was an error subscribing to the plan: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const renderPlan = (plan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const price = plan.price ? (plan.price / 100).toFixed(2) : 'N/A';
    const intervalLabel = plan.interval === 'year' ? 'year' : plan.interval === 'month' ? 'month' : plan.interval;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planBox, isSelected && styles.selectedPlanBox]}
        onPress={() => handleSelectPlan(plan)}
        disabled={isSubscribing}
      >
        <Text style={styles.planName}>{plan.name || 'Unnamed Plan'}</Text>
        <Text style={styles.planPrice}>${price} / {intervalLabel}</Text>
        <Text style={styles.planDescription}>{plan.description || 'No description available.'}</Text>
        {plan.interval === 'year' && <Text style={styles.savingsBadge}>Best Value!</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen 
        options={{
          title: 'Choose Your Plan',
          headerStyle: {
            backgroundColor: '#F8F9FA',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#4B6D9B',
          },
          // Add a back button if needed, depends on layout
          // headerLeft: () => ( ... custom back button ... )
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Optional: Remove header if Stack.Screen provides it */}
        {/* <Text style={styles.header}>Choose Your Plan</Text> */}

        {loadingPlans && <ActivityIndicator size="large" color="#4B6D9B" style={styles.loader} />}

        {error && !loadingPlans && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {!loadingPlans && !error && plans.length > 0 && (
          <View style={styles.plansContainer}>
            {plans.map(renderPlan)}
          </View>
        )}

        {!loadingPlans && !error && plans.length === 0 && (
           <Text style={styles.infoText}>No subscription plans available at this moment.</Text>
        )}

        {isSubscribing && (
          <View style={styles.subscribingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.subscribingText}>Processing Subscription...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20, // Add padding top if header removed
    paddingHorizontal: 20,
    paddingBottom: 40, // Ensure space at bottom
  },
  header: { // Kept in case Stack.Screen title isn't sufficient
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  loader: {
    marginTop: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    marginTop: 20,
  },
  plansContainer: {
    // Styles for the container holding all plan boxes
  },
  planBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E6ED',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  selectedPlanBox: {
    borderColor: '#4B6D9B',
    shadowColor: "#4B6D9B",
    shadowOpacity: 0.2,
    shadowRadius: 3.00,
    elevation: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B6D9B',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  savingsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFBF3F',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  subscribingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  subscribingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
}); 