FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy all source files
COPY . .

# Build the application inside the container
RUN npm run build

# Prune dev dependencies now that build is complete
RUN npm prune --omit=dev

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "cloud-run-server.cjs"]
