FROM node:20-slim

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Define the command to run your app
CMD ["node", "dist/index.js"]
