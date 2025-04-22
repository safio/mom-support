import 'dotenv/config';

// Hard-coded fallback values in case env vars aren't loaded
const SUPABASE_URL = 'https://psbnfxaufomqxyscrlmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYm5meGF1Zm9tcXh5c2NybG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NzYzMjAsImV4cCI6MjA1MjA1MjMyMH0.d1JWsul-MO0A2oxQXP786lxkH-If9iXLGz5KtE7azH8';
const APP_URL = 'momsupport://';

export default {
  expo: {
    name: "Mom Support",
    slug: "mom-support",
    scheme: "momsupport",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#4B6D9B"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      bundleIdentifier: "com.momsupport.app",
      supportsTablet: true
    },
    plugins: [
      "expo-router"
    ],
    extra: {
      // Use environment variables if available, otherwise use fallbacks
      supabaseUrl: process.env.SUPABASE_URL || SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
      appUrl: process.env.EXPO_PUBLIC_APP_URL || APP_URL,
      router: {
        origin: false
      },
      // By explicitly setting this to false, it will allow the app to find routes in the './app' directory
      expoRouter: {
        appRoot: './app'
      }
    }
  }
}; 