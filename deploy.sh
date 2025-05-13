#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

# Create server directory in dist
mkdir -p dist/server

# Copy server files to dist
echo "Copying server files..."
cp -r server/ dist/

# Create start script for production
echo "Creating production start script..."
cat > dist/server/start.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

// Start the server
const serverProcess = spawn('node', [path.join(__dirname, 'index.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process.', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
EOF

echo "Deployment build complete!"
echo "You can now deploy the 'dist' directory to Google Cloud."