import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import Button from './Button';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Component for creating custom self-care activities
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onSave - Function to call when activity is saved
 */
export default function CreateCustomActivity({ onClose, onSave }) {
  const { db } = useDatabase();
  
  // State for form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Category options
  const categories = [
    { id: 'Physical', icon: 'walking', color: '#FF9800' },
    { id: 'Mental', icon: 'brain', color: '#9C27B0' },
    { id: 'Emotional', icon: 'heart', color: '#E91E63' },
    { id: 'Social', icon: 'users', color: '#2196F3' },
    { id: 'Spiritual', icon: 'pray', color: '#4CAF50' },
    { id: 'Relaxation', icon: 'spa', color: '#00BCD4' },
  ];
  
  // Handle form submission
  const handleSave = async () => {
    // Validate form
    if (!name.trim()) {
      setError('Activity name is required');
      return;
    }
    
    if (!category) {
      setError('Please select a category');
      return;
    }
    
    if (!duration.trim()) {
      setError('Duration is required');
      return;
    }
    
    // Convert duration to number
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      setError('Please enter a valid duration in minutes');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create activity object
      const newActivity = {
        name: name.trim(),
        category,
        duration_minutes: durationMinutes,
        description: description.trim(),
        is_custom: true,
        color_code: getCategoryColor(category),
      };
      
      // Save the activity to the database
      const result = await db.createSelfCareActivity(newActivity);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Call the onSave callback with the created activity
      if (onSave) {
        onSave(result);
      }
      
      // Close the modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to save activity. Please try again.');
      console.error('Error saving custom activity:', err);
      setLoading(false);
    }
  };
  
  // Get color for category
  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#4B6D9B';
  };
  
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Create Custom Activity</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome5 name="times" size={18} color="#758494" />
        </TouchableOpacity>
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Activity Name*</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="What do you want to call this activity?"
          placeholderTextColor="#9AA6B5"
          autoCapitalize="words"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category*</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                category === cat.id && styles.selectedCategory,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <View 
                style={[
                  styles.categoryIcon, 
                  { backgroundColor: `${cat.color}20` }
                ]}
              >
                <FontAwesome5 name={cat.icon} size={16} color={cat.color} />
              </View>
              <Text style={[
                styles.categoryText,
                category === cat.id && styles.selectedCategoryText
              ]}>
                {cat.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Duration (minutes)*</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="How many minutes?"
          placeholderTextColor="#9AA6B5"
          keyboardType="number-pad"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what this activity involves"
          placeholderTextColor="#9AA6B5"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.cancelButton}
        />
        <Button
          label="Save Activity"
          variant="primary"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2B50',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E57373',
    marginBottom: 16,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A2B50',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    minHeight: 100,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    width: '46%',
  },
  selectedCategory: {
    borderColor: '#4B6D9B',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#1A2B50',
  },
  selectedCategoryText: {
    fontWeight: '600',
    color: '#4B6D9B',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
}); 