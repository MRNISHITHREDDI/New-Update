#!/bin/bash
# Deployment script for Google Cloud Run

echo "Building application..."
npm run build

echo "Creating server.js for Cloud Run deployment..."
cat > server.js << 'EOL'
// Simple express server for Cloud Run deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Mock storage for the Cloud deployment
const giftCode = '4033F8A7A14DE9DC179CDD9942EF52F6';
const verifications = [
  {
    id: 1,
    jalwaUserId: '12345',
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    jalwaUserId: '56789',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API routes
app.get('/api/admin/account-verifications', (req, res) => {
  console.log('Fetching verifications');
  res.json({ success: true, data: verifications });
});

app.get('/api/admin/account-verifications/status/:status', (req, res) => {
  const { status } = req.params;
  const filtered = verifications.filter(v => v.status === status);
  res.json({ success: true, data: filtered });
});

app.post('/api/admin/account-verifications/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  console.log(`Updating verification ${id} to ${status}`);
  
  const verification = verifications.find(v => v.id === parseInt(id));
  if (verification) {
    verification.status = status;
    verification.notes = notes;
    verification.updatedAt = new Date().toISOString();
    res.json({ success: true, data: verification });
  } else {
    res.status(404).json({ success: false, message: 'Verification not found' });
  }
});

app.get('/api/gift-code', (req, res) => {
  console.log('Fetching gift code');
  res.json({ success: true, data: giftCode });
});

app.post('/api/admin/gift-code', (req, res) => {
  const { code } = req.body;
  console.log(`Updating gift code to: ${code}`);
  
  if (code && code.length > 0) {
    // In a real app, we would save this to a database
    giftCode = code;
    res.json({ success: true, data: code });
  } else {
    res.status(400).json({ success: false, message: 'Invalid gift code' });
  }
});

// Serve static files from the dist/client directory
app.use(express.static(path.join(__dirname, 'dist/client')));

// Serve index.html for all other routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
});

// Get the port from environment variable
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

echo "Creating app.yaml for Google App Engine deployment..."
cat > app.yaml << 'EOL'
runtime: nodejs20

env_variables:
  NODE_ENV: "production"
EOL

echo "Creating DEPLOYMENT_INSTRUCTIONS.md..."
cat > DEPLOYMENT_INSTRUCTIONS.md << 'EOL'
# Deployment Instructions

## Option 1: Google Cloud Run Deployment

1. Build the application locally:
   ```
   npm run build
   ```

2. Create a server.js file for production (this is done automatically by deploy.sh)

3. Deploy to Google Cloud Run:
   ```
   gcloud run deploy jalwa --source . --platform managed --allow-unauthenticated
   ```

## Option 2: Google App Engine Deployment

1. Run the deploy.sh script to prepare the deployment files:
   ```
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. Deploy to Google App Engine:
   ```
   gcloud app deploy
   ```

## Troubleshooting

If you encounter any issues:

1. Check the logs:
   ```
   gcloud app logs tail -s default
   ```
   or
   ```
   gcloud logs read --project=YOUR_PROJECT_ID --freshness=1h "resource.type=cloud_run_revision AND resource.labels.service_name=jalwa"
   ```

2. Make sure you have the correct port configuration:
   - The application listens to the PORT environment variable (default: 8080)
   - Cloud Run automatically sets the PORT environment variable
EOL

echo "Creating GOOGLE_CLOUD_DEPLOYMENT.md..."
cat > GOOGLE_CLOUD_DEPLOYMENT.md << 'EOL'
# Google Cloud Deployment

This document explains the deployment process for the Jalwa application on Google Cloud.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. Project created on Google Cloud
3. Billing enabled for your project
4. Necessary APIs enabled:
   - Cloud Run API
   - App Engine API

## Option 1: Cloud Run Deployment (Recommended)

Cloud Run is a fully managed platform for containerized applications.

### Steps:

1. Authenticate with Google Cloud:
   ```
   gcloud auth login
   ```

2. Set your project:
   ```
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Build and deploy in one step:
   ```
   gcloud run deploy jalwa --source . --platform managed --allow-unauthenticated
   ```

This command does several things:
- Builds your container using Cloud Build
- Pushes it to Google Container Registry
- Deploys it to Cloud Run
- Makes it publicly accessible

## Option 2: App Engine Deployment

App Engine is a fully managed serverless platform.

### Steps:

1. Create app.yaml (already done by deploy.sh)

2. Deploy to App Engine:
   ```
   gcloud app deploy
   ```

3. Access your application:
   ```
   gcloud app browse
   ```

## Accessing Your Application

After successful deployment, you'll get a URL where your application is hosted:

- For Cloud Run: `https://jalwa-HASH.run.app`
- For App Engine: `https://PROJECT_ID.REGION_ID.r.appspot.com`
EOL

echo "Done! You can now deploy to Google Cloud Run with:"
echo "gcloud run deploy jalwa --source . --allow-unauthenticated"
