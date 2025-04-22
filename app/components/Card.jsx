import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Card component for consistent styling across the app
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} props.style - Additional style for the card
 * @param {boolean} props.gradient - Whether to use gradient background
 * @param {string[]} props.gradientColors - Colors for gradient background
 * @param {Function} props.onPress - Function to call when card is pressed
 * @param {number} props.elevation - Shadow elevation (1-5)
 * @param {boolean} props.noPadding - Remove default padding
 * @returns {React.ReactElement} Card component
 */
export default function Card({
  children,
  style,
  gradient = false,
  gradientColors = ['#f0f5ff', '#e4edff'],
  onPress,
  elevation = 2,
  noPadding = false,
}) {
  // Determine shadow based on elevation level
  const shadowStyles = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.05 * elevation,
    shadowRadius: 2 * elevation,
    elevation: elevation,
  };
  
  // Base card styles
  const cardBaseStyles = [
    styles.card,
    shadowStyles,
    noPadding ? {} : styles.padding,
    style,
  ];
  
  // Render card with or without gradient and touchable
  if (gradient) {
    const content = (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardBaseStyles}
      >
        {children}
      </LinearGradient>
    );
    
    return onPress ? (
      <TouchableOpacity style={styles.touchable} onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    ) : content;
  }
  
  // Non-gradient card
  const content = <View style={cardBaseStyles}>{children}</View>;
  
  return onPress ? (
    <TouchableOpacity style={styles.touchable} onPress={onPress} activeOpacity={0.9}>
      {content}
    </TouchableOpacity>
  ) : content;
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 16,
    marginVertical: 6,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 6,
  },
  padding: {
    padding: 16,
  },
}); 