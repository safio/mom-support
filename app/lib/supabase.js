import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Create adapter for secure storage
class ExpoSecureStoreAdapter {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error reading from SecureStore:', error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error saving to SecureStore:', error);
    }
  }

  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing from SecureStore:', error);
    }
  }
}

// Hardcoded fallback values - ONLY for development
const FALLBACK_SUPABASE_URL = 'https://psbnfxaufomqxyscrlmh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYm5meGF1Zm9tcXh5c2NybG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NzYzMjAsImV4cCI6MjA1MjA1MjMyMH0.d1JWsul-MO0A2oxQXP786lxkH-If9iXLGz5KtE7azH8';

// Get the URL and key from the config or use fallbacks
let supabaseUrl = FALLBACK_SUPABASE_URL;
let supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;

try {
  // Try to get from Constants
  if (Constants.expoConfig?.extra?.supabaseUrl) {
    supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
  } else {
    console.log('Using fallback Supabase URL');
  }
  
  if (Constants.expoConfig?.extra?.supabaseAnonKey) {
    supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey;
  } else {
    console.log('Using fallback Supabase anon key');
  }
} catch (error) {
  console.warn('Error accessing config, using fallback values:', error);
}

// Final check to make sure we have the values
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials, using fallbacks');
  supabaseUrl = FALLBACK_SUPABASE_URL;
  supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new ExpoSecureStoreAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase; 