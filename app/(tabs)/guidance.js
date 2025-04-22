import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, SafeAreaView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// --- Constants ---
const ITEMS_PER_PAGE = 3;
const ALL_RESOURCES_CATEGORY_ID = 'all_premium_view'; // Special ID for viewing all
// -----------------

export default function GuidanceScreen() {
  const router = useRouter();
  const { db, isReady, checkFeatureAccess, trackFeatureUsage } = useDatabase();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [_allGuidanceResources, setAllGuidanceResources] = useState([]); // Store all fetched
  const [guidanceResources, setGuidanceResources] = useState([]); // Store displayed
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  // --- Pagination State --- (Inside component)
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // -----------------------
  
  // Check if user has access to guidance features
  const checkAccess = useCallback(async () => {
    console.log("Checking feature access...");
    let limitedAccess = false;
    let fullAccess = false;
    try {
      // 1. Check access based on metadata (original method)
      limitedAccess = await checkFeatureAccess('limited_guidance');
      fullAccess = await checkFeatureAccess('full_guidance'); // This might be false even after mock

      // 2. MOCK FLOW ADJUSTMENT: Check the user_subscriptions table directly
      try {
          const currentSubscription = await db.getUserSubscription();
          if (currentSubscription && currentSubscription.status === 'active' && currentSubscription.subscription_plans) {
              const planCode = currentSubscription.subscription_plans.plan_code;
              const subStatus = currentSubscription.status;
              if (subStatus === 'active' || subStatus === 'trialing') {
                  console.log("Direct Subscription Check:", planCode, subStatus);
                  if (planCode === 'premium' || planCode === 'family') {
                      fullAccess = true;
                      limitedAccess = true;
                  }
              }
          } else if (currentSubscription && currentSubscription.status === 'trialing' && currentSubscription.subscription_plans) {
             // Also grant access if trialing premium/family
             const planCode = currentSubscription.subscription_plans.plan_code;
             console.log("Direct Subscription Check (Trial):", planCode, currentSubscription.status);
             if (planCode === 'premium' || planCode === 'family') {
                 fullAccess = true;
                 limitedAccess = true;
             }
          }
      } catch (subError) {
          console.warn("Could not check user_subscriptions table directly:", subError.message);
          // Proceed with metadata-based access check result
      }

      setHasAccess(limitedAccess);
      setHasFullAccess(fullAccess);
      console.log("Final Access Check Results:", { hasAccess: limitedAccess, hasFullAccess: fullAccess });

      // Track basic usage if they have at least limited access
      if (limitedAccess) {
        try {
          await trackFeatureUsage('limited_guidance');
        } catch (trackingError) {
          console.warn('Error tracking guidance feature usage:', trackingError);
        }
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Fallback defaults
      setHasAccess(true); // Assume basic access on error
      setHasFullAccess(false);
    }
  }, [isReady, checkFeatureAccess, trackFeatureUsage, db]);
  
  // Use useFocusEffect to re-check access every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        console.log("Guidance screen focused, re-checking access.");
        checkAccess();
        // Initial data loads can also be triggered here if needed after access check
        loadCategories();
      }
    }, [isReady, checkAccess])
  );
  
  // Load guidance resources when category or access level changes
  useEffect(() => {
    if (isReady && hasAccess) {
      loadAllGuidanceResources();
    }
  }, [activeCategory, hasAccess, hasFullAccess, isReady]);
  
  // Load personalized recommendations if user has full access
  useEffect(() => {
    if (isReady && hasFullAccess) {
      loadRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [hasFullAccess, isReady]);
  
  // Load guidance categories
  const loadCategories = async () => {
    try {
      // Explicitly define the standard "All" category for filtering
      const allFilterCategory = [{ id: 'all', name: 'All', icon_name: 'th-large' }];
      const dbCategories = await db.getGuidanceCategories();
      if (dbCategories && dbCategories.length > 0) {
        setCategories([...allFilterCategory, ...dbCategories]);
      } else {
        // Fallback including the standard "All"
        setCategories([
          { id: 'all', name: 'All', icon_name: 'th-large' },
          { id: 'behavior', name: 'Behavior', icon_name: 'child' },
          { id: 'sleep', name: 'Sleep', icon_name: 'moon-o' },
          { id: 'eating', name: 'Eating', icon_name: 'cutlery' },
          { id: 'development', name: 'Development', icon_name: 'line-chart' },
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback including the standard "All"
      setCategories([
        { id: 'all', name: 'All', icon_name: 'th-large' },
        { id: 'behavior', name: 'Behavior', icon_name: 'child' },
        { id: 'sleep', name: 'Sleep', icon_name: 'moon-o' },
        { id: 'eating', name: 'Eating', icon_name: 'cutlery' },
        { id: 'development', name: 'Development', icon_name: 'line-chart' },
      ]);
    }
  };
  
  // Load *all* guidance resources based on activeCategory or special view
  const loadAllGuidanceResources = useCallback(async () => {
    if (!isReady || !hasAccess) return;
    setLoading(true);
    try {
      // Determine category filter for DB query
      // Use 'all' string for fetching all, which db method expects
      const categoryToFetch = activeCategory === ALL_RESOURCES_CATEGORY_ID ? 'all' : activeCategory;
      console.log(`Fetching resources for category: ${categoryToFetch}`);

      // db.getGuidanceResources handles 'all' string correctly
      const allResources = await db.getGuidanceResources(categoryToFetch);

      setAllGuidanceResources(allResources); // Store the full list
      setGuidanceResources(allResources.slice(0, ITEMS_PER_PAGE)); // Display first page
      setCurrentPage(1); // Reset page
    } catch (error) {
      console.error('Error loading guidance resources:', error);
      setAllGuidanceResources([]);
      setGuidanceResources([]);
    } finally {
      setLoading(false);
    }
    // Dependencies updated to include activeCategory, hasAccess, etc.
  }, [activeCategory, hasAccess, hasFullAccess, isReady, db]);

  // Function to load more items
  const handleLoadMore = () => {
    if (isLoadingMore || allItemsLoaded) return; // Check allItemsLoaded here
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const nextItems = _allGuidanceResources.slice(0, nextPage * ITEMS_PER_PAGE);
    // Simulate network delay for loading indicator (optional)
    setTimeout(() => {
        setGuidanceResources(nextItems);
        setCurrentPage(nextPage);
        setIsLoadingMore(false); 
    }, 300); 
  };

  // Derived state: Check if all items are currently loaded/displayed
  const allItemsLoaded = _allGuidanceResources.length > 0 && guidanceResources.length >= _allGuidanceResources.length;

  // Load personalized recommendations
  const loadRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      // Only try loading recommendations if user has premium access
      if (hasFullAccess) {
        const recs = await db.getPersonalizedRecommendations();
        setRecommendations(recs);
      } else {
        // For basic access, don't show any recommendations
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Handle viewing an article - check access and track usage
  const handleViewArticle = async (article) => {
    try {
      // Check if premium content and user has access
      if (article.is_premium && !hasFullAccess) {
        // Show message about premium content
        console.log('This is premium content - upgrade required');
        return;
      }
      
      // Track usage based on content type
      try {
        if (article.is_premium) {
          // Track premium content usage
          await trackFeatureUsage('full_guidance');
        } else {
          // Track basic guidance usage
          await trackFeatureUsage('limited_guidance');
        }
      } catch (trackingError) {
        // Log but don't block the user experience
        console.warn('Error tracking feature usage:', trackingError);
      }
      
      // Set the selected article and open the modal
      setSelectedArticle(article);
      setModalVisible(true);
      
      console.log('Viewing article:', article.title);
    } catch (error) {
      console.error('Error handling article view:', error);
    }
  };
  
  // Handle pressing a locked premium item when user doesn't have access
  const handlePremiumItemPress = () => {
    console.log('Premium item clicked, navigating to subscribe screen.');
    // Optionally, show an alert first:
    // Alert.alert("Premium Content", "Upgrade your plan to access this resource.", [
    //   { text: "Cancel", style: "cancel" },
    //   { text: "View Plans", onPress: () => router.push('/(subscription)') } // Explicit path in comment
    // ]);
    router.push('/(subscription)'); // Explicit path
  };
  
  // Handle pressing the button in the "Need More Guidance?" section
  const handleBottomActionPress = () => {
    if (hasFullAccess) {
      // Set category to special value to trigger loading all resources
      console.log('Premium user viewing all resources...');
      setActiveCategory(ALL_RESOURCES_CATEGORY_ID);
      // Optionally scroll to top or provide other UI feedback
    } else {
      // Navigate non-premium users to subscribe screen
      console.log('Non-premium user prompted to upgrade...');
      router.push('/(subscription)'); // Explicit path
    }
  };
  
  // Close the article modal
  const closeModal = () => {
    setModalVisible(false);
  };
  
  // Render article content in the modal
  const renderArticleContent = () => {
    if (!selectedArticle) return null;
    
    return (
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleCategory}>
            {categories.find(cat => cat.id === (selectedArticle.category_id || selectedArticle.category))?.name || 'General'}
          </Text>
          {selectedArticle.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.articleTitle}>{selectedArticle.title}</Text>
        
        <View style={styles.articleImageContainer}>
          <Text style={styles.articleImage}>{selectedArticle.image_emoji || '📝'}</Text>
        </View>
        
        <Text style={styles.articleDescription}>{selectedArticle.description}</Text>
        
        <View style={styles.articleDivider} />
        
        <Text style={styles.articleContent}>
          {selectedArticle.content || `This is the full content of "${selectedArticle.title}". It includes helpful information and practical advice related to ${categories.find(cat => cat.id === (selectedArticle.category_id || selectedArticle.category))?.name || 'parenting'}.
          
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras porttitor augue non ante sodales ultricies. Fusce dapibus turpis vel risus feugiat scelerisque.

Key points to remember:
• Be consistent with your approach
• Set clear boundaries and expectations
• Practice positive reinforcement
• Take care of your own wellbeing too

Remember that every child is different, and what works for one might not work for another. The most important thing is to maintain a loving, supportive relationship with your child.`}
        </Text>
      </View>
    );
  };
  
  // Loading state
  if (!isReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4B6D9B" />
        <Text style={styles.loadingText}>Loading guidance...</Text>
      </View>
    );
  }
  
  // No access state
  if (!hasAccess) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <FontAwesome name="lock" size={40} color="#666" style={styles.lockIcon} />
        <Text style={styles.noAccessText}>
          {isAuthenticated
            ? "You don't have access to guidance features with your current subscription."
            : "Please log in to access guidance features."}
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guidance</Text>
        <Text style={styles.subtitle}>Practical parenting strategies</Text>
      </View>
      
      {/* For You Section */}
      <View style={styles.forYouContainer}>
        <Text style={styles.sectionTitle}>For You</Text>
        <Text style={styles.sectionSubtitle}>
          {hasFullAccess 
            ? "Personalized recommendations based on your logs" 
            : "Upgrade for personalized content based on your activity"}
        </Text>
        
        {loadingRecommendations ? (
          <ActivityIndicator size="small" color="#4B6D9B" style={styles.loaderSmall} />
        ) : recommendations.length === 0 ? (
          <Text style={styles.emptyText}>
            {hasFullAccess 
              ? "No recommendations available yet. Continue using the app for personalized content."
              : "Upgrade to premium to receive personalized recommendations."}
          </Text>
        ) : recommendations.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.recommendationItem}
            onPress={() => handleViewArticle(item)}
          >
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>{item.title}</Text>
              <Text style={styles.recommendationDescription}>{item.description}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#4B6D9B" />
          </TouchableOpacity>
        ))}
        
        {!hasFullAccess && (
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade for Personalized Recommendations</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Categories - Add visual indication if viewing ALL resources */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
         {activeCategory === ALL_RESOURCES_CATEGORY_ID && (
           <View style={[styles.categoryButton, styles.activeCategoryButton]}>
             <FontAwesome name="list" size={16} color={'#fff'} style={styles.categoryIcon} />
             <Text style={[styles.categoryText, styles.activeCategoryText]}>All Resources</Text>
           </View>
         )}
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && styles.activeCategoryButton,
              // Disable regular categories if viewing all premium
              activeCategory === ALL_RESOURCES_CATEGORY_ID && styles.disabledCategoryButton
            ]}
            onPress={() => {
                // Allow switching back from ALL view to a specific category
                if (activeCategory === ALL_RESOURCES_CATEGORY_ID) {
                    setActiveCategory(category.id);
                } else {
                    setActiveCategory(category.id);
                }
            }}
            disabled={activeCategory === category.id} // Disable the currently active one
          >
            <FontAwesome
              name={category.icon_name}
              size={16}
              color={activeCategory === category.id ? '#fff' : '#4B6D9B'}
              style={styles.categoryIcon}
            />
            <Text
              style={[
                styles.categoryText,
                activeCategory === category.id && styles.activeCategoryText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Guidance Articles */}
      <View style={styles.guidanceContainer}>
        {loading && guidanceResources.length === 0 ? ( 
          <ActivityIndicator size="large" color="#4B6D9B" style={styles.loader} />
        ) : _allGuidanceResources.length === 0 && !loading ? ( 
          <Text style={styles.emptyText}>No guidance resources available for this category.</Text>
        ) : (
          guidanceResources.map((item) => {
            const isLockedPremium = item.is_premium && !hasFullAccess;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.guidanceItem,
                  isLockedPremium && styles.maskedPremiumItem // Apply masked style
                ]}
                onPress={() => isLockedPremium ? handlePremiumItemPress() : handleViewArticle(item)}
              >
                <View style={styles.guidanceImageContainer}>
                   <Text style={styles.guidanceImage}>{isLockedPremium ? '🔒' : (item.image_emoji || '📝')}</Text>
                  {item.is_premium && ( // Always show PRO badge if premium
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
                <View style={styles.guidanceContent}>
                  <View style={styles.guidanceHeader}>
                    <Text style={styles.guidanceCategory}>
                      {categories.find(cat => cat.id === (item.category_id || item.category))?.name || 'General'}
                    </Text>
                    <Text style={styles.guidanceReadTime}>{item.read_time || '5 min read'}</Text>
                  </View>
                  <Text style={styles.guidanceTitle}>{item.title}</Text>
                  <Text style={styles.guidanceDescription} numberOfLines={isLockedPremium ? 1 : 2}>
                      {isLockedPremium ? "Upgrade to Premium to read..." : item.summary}
                  </Text>
                   {isLockedPremium && (
                       <View style={styles.lockedContent}>
                           <FontAwesome name="lock" size={16} color="#4B6D9B" />
                           <Text style={styles.lockedText}>Premium Content</Text>
                       </View>
                   )}
                </View>
              </TouchableOpacity>
            )
          })
        )}
         {/* Optional: Loading indicator when loading more */}
         {isLoadingMore && <ActivityIndicator size="small" color="#4B6D9B" style={{ marginVertical: 10 }} />} 
      </View>
      
      {/* Load More Button - Modified */} 
      {!loading && !allItemsLoaded && ( // Show button if not initial loading and not all items are loaded
        <View style={styles.loadMoreContainer}>
           <TouchableOpacity
             style={styles.loadMoreButton}
             onPress={handleLoadMore}
             disabled={isLoadingMore}
           >
             <Text style={styles.loadMoreButtonText}>
               {isLoadingMore ? "Loading..." : "Load More Guidance"}
             </Text>
           </TouchableOpacity>
        </View>
      )}

      {/* Expert Support Section - Updated onPress */}
      <View style={styles.expertContainer}>
        <Text style={styles.expertTitle}>Need More Guidance?</Text>
        <Text style={styles.expertDescription}>
          {hasFullAccess
            ? "Browse our complete library of evidence-based parenting resources."
            : "Upgrade to access our full library of premium parenting resources."}
        </Text>
        <TouchableOpacity
          style={styles.expertButton}
          onPress={handleBottomActionPress} // Use the updated handler
        >
          <Text style={styles.expertButtonText}>
            {hasFullAccess ? "View All Resources" : "Upgrade to Premium"}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Article Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            {renderArticleContent()}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeModal}
          >
            <FontAwesome name="times" size={24} color="#4B6D9B" />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6D9B',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loaderSmall: {
    marginVertical: 20,
  },
  loader: {
    marginVertical: 40,
  },
  noAccessText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 30,
  },
  lockIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  forYouContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: '#4B6D9B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: '#4B6D9B',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#4B6D9B',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  disabledCategoryButton: {
      opacity: 0.5, // Visually indicate disabled state when viewing all
  },
  guidanceContainer: {
    marginBottom: 30,
  },
  guidanceItem: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  maskedPremiumItem: {
    opacity: 0.65, // Example: Make it slightly faded
    backgroundColor: '#f0f0f0', // Maybe a grey background
  },
  guidanceImageContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E6ED',
    position: 'relative',
  },
  guidanceImage: {
    fontSize: 30,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFB74D',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  guidanceContent: {
    flex: 1,
    padding: 16,
  },
  guidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  guidanceCategory: {
    fontSize: 12,
    color: '#4B6D9B',
    fontWeight: '600',
  },
  guidanceReadTime: {
    fontSize: 12,
    color: '#666',
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  guidanceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  lockedText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4B6D9B',
    fontWeight: '500',
  },
  expertContainer: {
    backgroundColor: '#4B6D9B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  expertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  expertDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  expertButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  expertButtonText: {
    color: '#4B6D9B',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
    marginTop: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  articleContent: {
    paddingBottom: 40,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleCategory: {
    fontSize: 14,
    color: '#4B6D9B',
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    lineHeight: 36,
  },
  articleImageContainer: {
    backgroundColor: '#F0F4F8',
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  articleImage: {
    fontSize: 60,
  },
  articleDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  articleDivider: {
    height: 1,
    backgroundColor: '#E0E6ED',
    marginVertical: 20,
  },
  articleContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 40,
  },
  loadMoreButton: {
    backgroundColor: '#E0E6ED',
    paddingHorizontal: 30,
  },
  loadMoreButtonText: {
    color: '#4B6D9B',
    fontSize: 16,
    fontWeight: '600',
  },
}); 