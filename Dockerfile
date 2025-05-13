FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy everything else
COPY . .

# Build the application
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Cloud Run will set this environment variable for you
ENV PORT=8080

# Run the compiled JavaScript
CMD ["node", "dist/server/index.js"]
