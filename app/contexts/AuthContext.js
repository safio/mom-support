import React, { createContext, useState, useContext, useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import supabase from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { generateUUID } from '../lib/uuid-helper';

// Create the authentication context
const AuthContext = createContext({});

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const segments = useSegments();
  
  // Function to check if the user is in an auth group
  const useProtectedRoute = (user) => {
    const segments = useSegments();
    
    useEffect(() => {
      if (!segments || segments.length === 0) return;
      
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      
      if (!user && !inAuthGroup) {
        // If no user and not in auth group, redirect to login
        router.replace('/(auth)/anonymous-login');
      } else if (user && inAuthGroup) {
        // If user is authenticated and in auth group, redirect to main app
        router.replace('/(tabs)');
      }
    }, [user, segments]);
  };
  
  // Apply the protected route hook
  useProtectedRoute(user);
  
  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if we have an anonymous user stored
        const anonymousUserId = await SecureStore.getItemAsync('anonymousUserId');
        
        if (anonymousUserId) {
          // If we have an anonymous user ID, create a user object
          // Check if the user has viewed the getting started screen
          const hasViewedGetStarted = await SecureStore.getItemAsync('anonymousUserHasViewedGetStarted') === 'true';
          // Get any stored profile data
          const profileData = await SecureStore.getItemAsync('anonymousUserProfile');
          const userMetadata = profileData ? JSON.parse(profileData) : {};
          
          setUser({
            id: anonymousUserId,
            isAnonymous: true,
            hasViewedGetStarted,
            user_metadata: userMetadata,
            created_at: await SecureStore.getItemAsync('anonymousUserCreatedAt') || new Date().toISOString()
          });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // Otherwise check for a regular Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(session);
        setUser(session?.user || null);
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error('Error checking auth session:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`);
      
      // If signing out, also clear anonymous user data
      if (event === 'SIGNED_OUT') {
        await SecureStore.deleteItemAsync('anonymousUserId');
        await SecureStore.deleteItemAsync('anonymousUserCreatedAt');
      }
      
      setSession(session);
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
      setLoading(false);
    });
    
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  
  // Anonymous login function
  const anonymousLogin = async () => {
    try {
      // Generate a unique ID using our helper that has built-in fallbacks
      const anonymousUserId = generateUUID();
      const createdAt = new Date().toISOString();
      
      // Store the anonymous user ID securely
      await SecureStore.setItemAsync('anonymousUserId', anonymousUserId);
      await SecureStore.setItemAsync('anonymousUserCreatedAt', createdAt);
      
      // Set the user in state
      setUser({
        id: anonymousUserId,
        isAnonymous: true,
        created_at: createdAt
      });
      setIsAuthenticated(true);
      
      return { data: { user: { id: anonymousUserId, isAnonymous: true } }, error: null };
    } catch (error) {
      console.error('Anonymous login error:', error);
      return { data: null, error };
    }
  };
  
  // Sign up function
  const signup = async (email, password, fullName) => {
    try {
      // If user was anonymous, we could potentially link accounts here
      const wasAnonymous = user?.isAnonymous;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      // Clear anonymous user data if signup is successful
      if (wasAnonymous && data.session) {
        await SecureStore.deleteItemAsync('anonymousUserId');
        await SecureStore.deleteItemAsync('anonymousUserCreatedAt');
      }
      
      // Check if email confirmation is required
      const needsEmailVerification = !data.session;
      
      return { data, error: null, needsEmailVerification };
    } catch (error) {
      console.error('Signup error:', error.message);
      return { data: null, error };
    }
  };
  
  // Sign in function
  const signin = async (email, password) => {
    try {
      // If user was anonymous, we could potentially link accounts here
      const wasAnonymous = user?.isAnonymous;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Clear anonymous user data if signin is successful
      if (wasAnonymous) {
        await SecureStore.deleteItemAsync('anonymousUserId');
        await SecureStore.deleteItemAsync('anonymousUserCreatedAt');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Signin error:', error.message);
      return { data: null, error };
    }
  };
  
  // Sign out function
  const signout = async () => {
    try {
      // Clear anonymous user if exists
      if (user?.isAnonymous) {
        await SecureStore.deleteItemAsync('anonymousUserId');
        await SecureStore.deleteItemAsync('anonymousUserCreatedAt');
        setUser(null);
        setIsAuthenticated(false);
        return { error: null };
      }
      
      // Otherwise sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Signout error:', error.message);
      return { error };
    }
  };
  
  // Send password reset email
  const sendPasswordResetEmail = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Password reset error:', error.message);
      return { error };
    }
  };
  
  // Confirm password reset with new password
  const confirmResetPassword = async (token, newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Confirm password reset error:', error.message);
      return { error };
    }
  };
  
  // Verify email with OTP token
  const verifyEmail = async (email, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Email verification error:', error.message);
      return { error };
    }
  };
  
  // Resend verification email
  const resendVerificationEmail = async (email) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Resend verification error:', error.message);
      return { error };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      // For anonymous users, store profile updates in SecureStore
      if (user?.isAnonymous) {
        const currentProfile = JSON.parse(await SecureStore.getItemAsync('anonymousUserProfile') || '{}');
        const updatedProfile = { ...currentProfile, ...updates };
        await SecureStore.setItemAsync('anonymousUserProfile', JSON.stringify(updatedProfile));
        
        return { 
          data: { 
            user: { ...user, user_metadata: updatedProfile } 
          }, 
          error: null 
        };
      }
      
      // For regular users, update through Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error.message);
      return { error };
    }
  };
  
  // Auth context value
  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    anonymousLogin,
    signup,
    signin,
    signout,
    sendPasswordResetEmail,
    confirmResetPassword,
    verifyEmail,
    resendVerificationEmail,
    updateProfile,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 