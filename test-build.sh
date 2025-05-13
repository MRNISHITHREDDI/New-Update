#!/bin/bash
# Test build script to verify the build process locally

echo "Testing build process..."

# Step 1: Build the application
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build completed successfully."

# Verify dist directory structure
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found after build!"
    exit 1
fi

if [ ! -d "dist/client" ]; then
    echo "❌ dist/client directory not found after build!"
    exit 1
fi

echo "✅ dist directory structure looks correct."

# Test production server
echo "Testing production server..."
node -c production-server.js

if [ $? -ne 0 ]; then
    echo "❌ Production server has syntax errors."
    exit 1
fi

echo "✅ Production server syntax is valid."

echo ""
echo "Build test completed successfully! You should be ready to deploy."
echo "Run: gcloud run deploy jalwa --source . --platform managed --allow-unauthenticated"
