import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import database from '../lib/database';
import { useAuth } from './AuthContext';

// Create context
const DatabaseContext = createContext(null);

// Provider component
export const DatabaseProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [featureAccessCache, setFeatureAccessCache] = useState({});
  
  // Initialize database features when auth state changes
  useEffect(() => {
    const initializeFeatures = async () => {
      setIsReady(false);
      // Clear cache when auth state changes
      setFeatureAccessCache({});
      
      try {
        // Preload common feature access permissions
        const basicTrackingAccess = await database.hasFeatureAccess('basic_tracking');
        const unlimitedTrackingAccess = await database.hasFeatureAccess('unlimited_tracking');
        const limitedGuidanceAccess = await database.hasFeatureAccess('limited_guidance');
        const fullGuidanceAccess = await database.hasFeatureAccess('full_guidance');
        
        // Update cache
        setFeatureAccessCache({
          basic_tracking: basicTrackingAccess,
          unlimited_tracking: unlimitedTrackingAccess,
          limited_guidance: limitedGuidanceAccess,
          full_guidance: fullGuidanceAccess,
        });
        
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing database features:', error);
        // Even if there's an error, mark as ready to avoid blocking the app
        setIsReady(true);
      }
    };
    
    initializeFeatures();
  }, [isAuthenticated, user?.id]);
  
  // Check if user can access a feature
  const checkFeatureAccess = useCallback(async (featureCode) => {
    // Return from cache if available
    if (featureAccessCache[featureCode] !== undefined) {
      return featureAccessCache[featureCode];
    }
    
    try {
      // Otherwise check with database
      const hasAccess = await database.hasFeatureAccess(featureCode);
      
      // Update cache
      setFeatureAccessCache(prevCache => ({
        ...prevCache,
        [featureCode]: hasAccess
      }));
      
      return hasAccess;
    } catch (error) {
      console.error(`Error checking access for ${featureCode}:`, error);
      return false;
    }
  }, [featureAccessCache]);
  
  // Track feature usage
  const trackFeatureUsage = useCallback(async (featureCode) => {
    // First check if user has access
    const hasAccess = await checkFeatureAccess(featureCode);
    if (!hasAccess) return false;
    
    try {
      // Track usage
      await database.trackFeatureUsage(featureCode);
      return true;
    } catch (error) {
      console.error(`Error tracking usage for ${featureCode}:`, error);
      return false;
    }
  }, [checkFeatureAccess]);
  
  // Expose context value
  const contextValue = {
    db: database,
    isReady,
    checkFeatureAccess,
    trackFeatureUsage,
    featureAccessCache
  };
  
  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Custom hook to use the database context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}; 