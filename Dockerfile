FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy pre-built application
COPY dist/ ./dist/
COPY cloud-run-server.cjs ./

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "cloud-run-server.cjs"]
