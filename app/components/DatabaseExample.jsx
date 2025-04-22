import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';

export default function DatabaseExample() {
  const { db, isReady, checkFeatureAccess, trackFeatureUsage } = useDatabase();
  const { isAuthenticated } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  
  // Load data when database is ready
  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);
  
  // Load categories data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has access to basic tracking feature
      const canAccessFeature = await checkFeatureAccess('basic_tracking');
      setHasAccess(canAccessFeature);
      setAccessChecked(true);
      
      if (canAccessFeature) {
        // Track that we're using this feature
        await trackFeatureUsage('basic_tracking');
        
        // Fetch categories from database
        try {
          const situationCategories = await db.getSituationCategories();
          if (!situationCategories || situationCategories.length === 0) {
            setError('No categories found in database');
          } else {
            setCategories(situationCategories);
          }
        } catch (dbError) {
          console.error('Error fetching data from DB:', dbError);
          setError('Failed to fetch categories from database');
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle retry when error occurs
  const handleRetry = () => {
    loadData();
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </SafeAreaView>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Render no access state
  if (accessChecked && !hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.infoText}>
          {isAuthenticated 
            ? "You don't have access to this feature with your current subscription."
            : "Please log in to access all features."}
        </Text>
      </SafeAreaView>
    );
  }
  
  // Define ListHeaderComponent for FlatList
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Available Categories</Text>
      {categories.length === 0 && (
        <Text style={styles.emptyText}>No categories found</Text>
      )}
    </View>
  );
  
  // Render data
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>
          </View>
        )}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B00020',
    marginBottom: 16,
    textAlign: 'center',
    padding: 16,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  categoryItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 