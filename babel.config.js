module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      'inline-dotenv',
      '@babel/plugin-transform-export-namespace-from',
      ['module-resolver', {
        root: ['./app'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './app',
        },
      }],
      'expo-router/babel',
    ],
  };
}; 