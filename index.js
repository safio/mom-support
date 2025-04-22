// Import polyfills first
import './global-polyfills';

// Load UUID helper to ensure crypto polyfill is applied early
import './app/lib/uuid-helper';

import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
