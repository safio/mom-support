// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the project directory
config.watchFolders = [projectRoot];

// 2. Force Metro to resolve dependencies only from the project's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Add support for mjs and cjs files needed by Expo Router
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// 4. Enable require.context used by expo-router
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// 5. Set up Node.js module polyfills for React Native
// These modules are required by various dependencies like Supabase
config.resolver.extraNodeModules = {
  // Core Node.js modules
  stream: require.resolve('stream-browserify'),
  // Crypto polyfill - essential for UUID generation and secure operations
  crypto: require.resolve('react-native-crypto'),
  http: require.resolve('@tradle/react-native-http'),
  https: require.resolve('https-browserify'),
  zlib: require.resolve('browserify-zlib'),
  events: require.resolve('events'),
  
  // Additional modules sometimes needed
  net: 'empty-module',
  tls: 'empty-module',
  fs: 'empty-module',
  dns: 'empty-module',
  path: require.resolve('path-browserify'),
  os: require.resolve('os-browserify/browser'),
  assert: require.resolve('assert'),
  util: require.resolve('util'),
  buffer: require.resolve('buffer'),
  
  // Empty implementations for modules that can't be polyfilled
  child_process: 'empty-module',
  dgram: 'empty-module',
};

// 6. Enable symlinks
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle empty module case
  if (config.resolver.extraNodeModules[moduleName] === 'empty-module') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native/Libraries/Utilities/PolyfillFunctions.js'),
      type: 'sourceFile',
    };
  }

  // First, try resolving the module normally
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // If we can't resolve it normally and it's a require.context call, handle it
    if (moduleName.includes('require.context')) {
      return {
        filePath: path.resolve(__dirname, 'node_modules/metro-runtime/src/modules/empty.js'),
        type: 'sourceFile',
      };
    }
    throw error;
  }
};

module.exports = config; 