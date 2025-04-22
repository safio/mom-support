import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import Button from './Button';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Component for logging a new situation
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onSave - Function to call when situation is saved
 */
export default function LogSituation({ onClose, onSave }) {
  const { db } = useDatabase();
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [mood, setMood] = useState('okay');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Mood options
  const moodOptions = [
    { value: 'great', icon: 'grin-beam', color: '#4CAF50' },
    { value: 'good', icon: 'smile', color: '#8BC34A' },
    { value: 'okay', icon: 'meh', color: '#FFC107' },
    { value: 'stressed', icon: 'frown', color: '#FF9800' },
    { value: 'overwhelmed', icon: 'tired', color: '#F44336' },
  ];
  
  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);
  
  // Load categories from database
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const situationCategories = await db.getSituationCategories();
      if (situationCategories && situationCategories.length > 0) {
        setCategories(situationCategories);
        // Set first category as default
        if (!categoryId && situationCategories.length > 0) {
          setCategoryId(situationCategories[0].id);
        }
      } else {
        setError('No situation categories found');
      }
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading situation categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };
  
  // Handle form submission
  const handleSave = async () => {
    // Validate form
    if (!title.trim()) {
      setError('Situation title is required');
      return;
    }
    
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // Create situation object
      const newSituation = {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        situation_date: formattedDate,
        mood: mood
      };
      
      // Save the situation to the database
      const result = await db.logSituation(newSituation);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to save situation');
      }
      
      // Track feature usage
      await db.trackFeatureUsage('basic_tracking');
      
      // Call the onSave callback with the created situation
      if (onSave) {
        onSave(result.data);
      }
      
      // Close the modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to save situation. Please try again.');
      console.error('Error saving situation:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Get category by ID
  const getCategory = (id) => {
    return categories.find(c => c.id === id) || {};
  };
  
  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Log New Situation</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome5 name="times" size={18} color="#758494" />
        </TouchableOpacity>
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Title*</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief description of the situation"
          placeholderTextColor="#9AA6B5"
          autoCapitalize="sentences"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category*</Text>
        {loadingCategories ? (
          <ActivityIndicator size="small" color="#4B6D9B" />
        ) : (
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  categoryId === cat.id && styles.selectedCategory,
                  { borderColor: cat.color_code || '#E0E6ED' }
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <View 
                  style={[
                    styles.categoryIcon, 
                    { backgroundColor: `${cat.color_code}20` || '#f0f0f0' }
                  ]}
                >
                  <FontAwesome5 
                    name={cat.icon_name || 'question'} 
                    size={16} 
                    color={cat.color_code || '#4B6D9B'} 
                  />
                </View>
                <Text style={[
                  styles.categoryText,
                  categoryId === cat.id && styles.selectedCategoryText
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date*</Text>
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <FontAwesome5 name="calendar-alt" size={16} color="#4B6D9B" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>How did you feel?*</Text>
        <View style={styles.moodContainer}>
          {moodOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.moodOption,
                mood === option.value && styles.selectedMood,
                { borderColor: option.color }
              ]}
              onPress={() => setMood(option.value)}
            >
              <FontAwesome5
                name={option.icon}
                solid
                size={24}
                color={option.color}
                style={styles.moodIcon}
              />
              <Text style={[
                styles.moodText,
                { color: option.color }
              ]}>
                {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about what happened"
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
          label="Save Situation"
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
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    width: '46%',
  },
  selectedCategory: {
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
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
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  dateText: {
    fontSize: 16,
    color: '#1A2B50',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  moodOption: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '19%',
    borderWidth: 1,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  selectedMood: {
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  moodIcon: {
    marginBottom: 8,
  },
  moodText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
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