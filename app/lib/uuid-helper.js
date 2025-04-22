/**
 * UUID-helper.js - Utility functions for generating UUIDs with fallback mechanisms
 * 
 * This module provides reliable UUID generation even in environments where
 * crypto.getRandomValues() might not be available.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 with a fallback mechanism if crypto.getRandomValues fails
 * @returns {string} A UUID v4 string
 */
export const generateUUID = () => {
  try {
    // Try the standard uuid library first
    return uuidv4();
  } catch (e) {
    console.warn('UUID generation failed, using fallback:', e.message);
    return generateFallbackUUID();
  }
};

/**
 * Generate a UUID v4 without using crypto.getRandomValues()
 * This is less cryptographically secure but works in all environments
 * @returns {string} A UUID v4 compatible string
 */
export const generateFallbackUUID = () => {
  const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return pattern.replace(/[xy]/g, (c) => {
    // Use Math.random() as a fallback random source
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Force random bytes generation using Math.random
 * This can be used to polyfill crypto.getRandomValues
 * @param {Uint8Array} array - The array to fill with random values
 * @returns {Uint8Array} The array filled with random values
 */
export const getRandomValues = (array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
};

// Apply polyfill if needed
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    global.crypto = {};
  }
  
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = getRandomValues;
    console.log('Applied crypto.getRandomValues polyfill');
  }
}

export default {
  generateUUID,
  generateFallbackUUID,
  getRandomValues
}; 