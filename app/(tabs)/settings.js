import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Card from '../components/Card';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const { user, signout, isAuthenticated } = useAuth();
  const { db, isReady } = useDatabase();
  const [loading, setLoading] = useState(false);
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState(true);
  
  // --- Subscription State ---
  const [currentUserSubscription, setCurrentUserSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  // -------------------------
  
  // --- Subscription Functions ---
  const loadCurrentUserSubscription = useCallback(async () => {
    if (!user || !db || !isReady) {
        if (!isReady) return;
        setLoadingSubscription(false);
        return;
    }
    setLoadingSubscription(true);
    setSubscriptionError(null);
    try {
      const subscription = await db.getUserSubscription();
      setCurrentUserSubscription(subscription);
      console.log("[Settings Tab] Fetched current user subscription:", subscription);
    } catch (err) {
      console.error("[Settings Tab] Error loading current subscription:", err);
      setSubscriptionError("Failed to load your subscription details. Please try again later.");
    } finally {
      setLoadingSubscription(false);
    }
  }, [user, db, isReady]);

  useEffect(() => {
    loadCurrentUserSubscription();
  }, [loadCurrentUserSubscription]);

  const handleCancelSubscription = async () => {
    if (!currentUserSubscription) return;

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel your subscription? You will retain access until the end of the current period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Confirm Cancel",
          style: "destructive",
          onPress: async () => {
            setIsProcessingSubscription(true);
            setSubscriptionError(null);
            try {
              await db.cancelSubscription();
              Alert.alert("Subscription Canceled", "Your subscription has been set to cancel at the end of the period.");
              await loadCurrentUserSubscription();
            } catch (err) {
              console.error("Error canceling subscription:", err);
              setSubscriptionError(`Failed to cancel subscription: ${err.message}`);
              Alert.alert("Cancellation Failed", `Could not cancel the subscription: ${err.message}`);
            } finally {
              setIsProcessingSubscription(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivateSubscription = async () => {
    if (!currentUserSubscription) return;

    setIsProcessingSubscription(true);
    setSubscriptionError(null);
    try {
      await db.reactivateSubscription();
      Alert.alert("Subscription Reactivated", "Your subscription has been reactivated.");
      await loadCurrentUserSubscription();
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      setSubscriptionError(`Failed to reactivate subscription: ${err.message}`);
      Alert.alert("Reactivation Failed", `Could not reactivate the subscription: ${err.message}`);
    } finally {
      setIsProcessingSubscription(false);
    }
  };

  const renderSubscriptionManagement = () => {
    if (loadingSubscription) {
      return <ActivityIndicator size="small" color="#4B6D9B" style={{ marginVertical: 20 }} />;
    }
    if (subscriptionError) {
      return <Text style={styles.errorText}>{subscriptionError}</Text>;
    }
    if (!currentUserSubscription) {
      return (
        <View style={styles.subscriptionCard}>
          <Text style={styles.noSubscriptionText}>You do not have an active subscription.</Text>
          <Button
            label="View Plans"
            onPress={() => router.push('/(subscription)')}
            variant="primary"
            style={{ marginTop: 15 }}
          />
        </View>
      );
    }

    const { plan_name, status, end_date, auto_renew } = currentUserSubscription;
    const formattedEndDate = end_date ? format(new Date(end_date), 'MMMM d, yyyy') : 'N/A';
    const isActive = status === 'active' || status === 'trialing';
    const willCancel = isActive && !auto_renew;

    return (
      <View style={styles.subscriptionCard}>
        <Text style={styles.planName}>{plan_name || 'Unknown Plan'}</Text>
        <Text style={styles.statusText}>
          Status: <Text style={styles.statusValue}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
        </Text>
        <Text style={styles.dateText}>
          {isActive ? `Access Until: ${formattedEndDate}` : 'Subscription Expired'}
        </Text>

        {willCancel && (
          <Text style={styles.cancelNotice}>
            Your subscription will cancel on {formattedEndDate}. You can reactivate it below.
          </Text>
        )}

        {subscriptionError && <Text style={styles.errorText}>{subscriptionError}</Text>}

        {isActive && !willCancel && (
          <Button
            label={isProcessingSubscription ? "Processing..." : "Cancel Subscription"}
            onPress={handleCancelSubscription}
            isLoading={isProcessingSubscription}
            disabled={isProcessingSubscription}
            variant="danger"
            style={styles.subscriptionActionButton}
          />
        )}
        {willCancel && (
          <Button
            label={isProcessingSubscription ? "Processing..." : "Reactivate Subscription"}
            onPress={handleReactivateSubscription}
            isLoading={isProcessingSubscription}
            disabled={isProcessingSubscription}
            variant="primary"
            style={styles.subscriptionActionButton}
          />
        )}
         {!isActive && status !== 'canceled' && status !== 'expired' && (
            <Button
                label="View Plans to Renew"
                onPress={() => router.push('/(subscription)')}
                variant="primary"
                style={styles.subscriptionActionButton}
            />
         )}
      </View>
    );
  }
  // --- End Subscription Functions ---
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await signout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4B6D9B" />
        <Text style={styles.loadingText}>Logging out...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>
      
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileIconContainer}>
            <FontAwesome name="user-circle" size={48} color="#4B6D9B" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.full_name || 'Mom Support User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || (user?.isAnonymous ? 'Anonymous User' : 'No email provided')}
            </Text>
            <Text style={styles.accountType}>
              {user?.isAnonymous ? 'Anonymous Account' : 'Registered Account'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* --- Subscription Section --- */}
      {!user?.isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          {renderSubscriptionManagement()}
        </View>
      )}
      {/* ------------------------- */}
      
      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <FontAwesome name="bell" size={20} color="#4B6D9B" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#E0E6ED', true: '#4B6D9B' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <FontAwesome name="moon-o" size={20} color="#4B6D9B" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: '#E0E6ED', true: '#4B6D9B' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <FontAwesome name="lock" size={20} color="#4B6D9B" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Privacy Mode</Text>
          </View>
          <Switch
            value={privacyModeEnabled}
            onValueChange={setPrivacyModeEnabled}
            trackColor={{ false: '#E0E6ED', true: '#4B6D9B' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
      
      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        {user?.isAnonymous && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <View style={styles.actionInfo}>
              <FontAwesome name="user-plus" size={20} color="#4B6D9B" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Create Account</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#CCD0D5" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'This feature will be available in a future update.')}
        >
          <View style={styles.actionInfo}>
            <FontAwesome name="question-circle" size={20} color="#4B6D9B" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Help & Support</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color="#CCD0D5" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'This feature will be available in a future update.')}
        >
          <View style={styles.actionInfo}>
            <FontAwesome name="file-text-o" size={20} color="#4B6D9B" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Privacy Policy</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color="#CCD0D5" />
        </TouchableOpacity>
      </View>
      
      {/* Logout Button */}
      {!user?.isAnonymous && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}
      
      {/* Version Info */}
      <Text style={styles.versionText}>Mom Support v1.0.0</Text>
      
      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#758494',
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileIconContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#758494',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#4B6D9B',
    fontWeight: '500',
    backgroundColor: '#E0E6ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A2B50',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  actionLabel: {
    fontSize: 16,
    color: '#1A2B50',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#FFEBEB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
    fontSize: 12,
    color: '#9AA5B1',
  },
  bottomSpacing: {
    height: 40,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#758494',
    textAlign: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2B50',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#445771',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusValue: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 16,
    color: '#445771',
    textAlign: 'center',
    marginBottom: 20,
  },
  subscriptionActionButton: {
    marginTop: 15,
  },
  cancelNotice: {
    fontSize: 14,
    color: '#FFA000',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 15,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#758494',
    textAlign: 'center',
    marginBottom: 10,
  },
}); 