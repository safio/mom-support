import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Button component with various styles
 * @param {Object} props - Component props
 * @param {string} props.label - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} props.variant - Button style variant (primary, secondary, outline, text)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.loading - Whether to show loading indicator
 * @param {string} props.icon - FontAwesome5 icon name to show before label
 * @param {Object} props.style - Additional style for the button
 * @param {Object} props.textStyle - Additional style for the button text
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string[]} props.gradientColors - Colors for gradient background (primary variant only)
 * @returns {React.ReactElement} Button component
 */
export default function Button({ 
  label, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  style,
  textStyle,
  disabled = false,
  gradientColors,
}) {
  // Define sizes
  const sizes = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 12,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 14,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      fontSize: 18,
      iconSize: 16,
    },
  };
  
  // Select size
  const sizeStyle = sizes[size] || sizes.medium;
  
  // Define variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
          gradient: true,
          colors: gradientColors || ['#4B6D9B', '#3A5783'],
        };
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
          gradient: false,
        };
      case 'outline':
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
          gradient: false,
        };
      case 'text':
        return {
          button: styles.textButton,
          text: styles.textButtonText,
          gradient: false,
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
          gradient: true,
          colors: ['#4B6D9B', '#3A5783'],
        };
    }
  };
  
  const variantStyle = getVariantStyles();
  
  // Button container style
  const buttonContainerStyle = [
    styles.button,
    variantStyle.button,
    { 
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabledButton,
    style,
  ];
  
  // Button text style
  const buttonTextStyle = [
    styles.text,
    variantStyle.text,
    { fontSize: sizeStyle.fontSize },
    disabled && styles.disabledText,
    textStyle,
  ];
  
  // Render button content
  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#4B6D9B'} 
          size="small" 
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && (
            <FontAwesome5 
              name={icon} 
              size={sizeStyle.iconSize} 
              color={variantStyle.text.color}
              style={styles.icon} 
            />
          )}
          <Text style={buttonTextStyle}>{label}</Text>
        </View>
      )}
    </>
  );
  
  // If primary with gradient, use LinearGradient
  if (variantStyle.gradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, fullWidth && styles.fullWidth]}
      >
        <LinearGradient
          colors={variantStyle.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonContainerStyle}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  // Other button types
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[buttonContainerStyle, styles.buttonWrapper]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  // Primary Button
  primaryButton: {
    backgroundColor: '#4B6D9B',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  // Secondary Button
  secondaryButton: {
    backgroundColor: '#E8EEF4',
  },
  secondaryText: {
    color: '#4B6D9B',
  },
  // Outline Button
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4B6D9B',
  },
  outlineText: {
    color: '#4B6D9B',
  },
  // Text Button
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textButtonText: {
    color: '#4B6D9B',
  },
  // Disabled state
  disabledButton: {
    backgroundColor: '#E8EEF4',
    borderColor: '#E8EEF4',
  },
  disabledText: {
    color: '#A5B2C0',
  },
}); 