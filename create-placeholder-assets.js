const fs = require('fs');
const path = require('path');

// Define assets directory
const assetsDir = path.join(__dirname, 'assets');

// Ensure the assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple 1x1 transparent pixel PNG in base64
// This is a minimal valid PNG file
const transparentPixelPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Assets to create
const assets = [
  { name: 'icon.png', description: 'App icon' },
  { name: 'splash.png', description: 'Splash screen' },
  { name: 'adaptive-icon.png', description: 'Adaptive icon for Android' }
];

// Create each placeholder PNG file
assets.forEach(asset => {
  const filePath = path.join(assetsDir, asset.name);
  fs.writeFileSync(filePath, transparentPixelPNG);
  console.log(`Created placeholder PNG for ${asset.name} (${asset.description})`);
});

console.log('All placeholder assets created successfully!');
console.log('For production, replace these placeholder PNGs with actual images.'); 