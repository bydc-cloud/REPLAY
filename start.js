// Start script - for now just run the frontend
// The database features require the API to run separately
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log('Starting Replay Music Organizer...');
console.log('Note: Database features are currently disabled. Using local storage only.');

// Just run the frontend for now
execSync(`npx vite preview --port ${PORT} --host`, {
  stdio: 'inherit'
});