// Polyfill the Node.js modules that are used by dependencies
import streamBrowserify from 'stream-browserify';
import events from 'events';
import util from 'util';
import buffer from 'buffer';
import path from 'path-browserify';
import os from 'os-browserify/browser';

// Apply polyfills directly to the global object
if (global) {
  // Stream module
  global.Stream = streamBrowserify;
  global.stream = streamBrowserify;
  
  // Events module
  global.events = events;
  global.Events = events;
  
  // Other common Node.js modules
  global.Buffer = buffer.Buffer;
  global.process = {
    ...global.process,
    env: { ...global.process?.env, NODE_ENV: process.env.NODE_ENV || 'development' },
    browser: true,
    version: '',
    versions: {},
    cwd: () => '/',
    platform: os.platform(),
    nextTick: (callback) => setTimeout(callback, 0),
  };
  
  // Utility modules
  global.util = util;
  global.path = path;
  global.os = os;
  
  // Polyfill for crypto.getRandomValues
  if (!global.crypto) {
    global.crypto = {};
  }
  
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = function(arr) {
      // Simple polyfill that doesn't use cryptographically secure random values
      // This is OK for development but should not be used in production
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
    console.log('Applied crypto.getRandomValues polyfill');
  }
}

console.log('Node.js polyfills applied');

// Add any other polyfills that might be needed in the future here