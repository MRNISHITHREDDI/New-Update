FROM node:18-slim

WORKDIR /app

# Copy only the production server file and package.json
COPY production-server.js ./
COPY package.json ./

# Install only express
RUN npm install express

# Expose port 8080
EXPOSE 8080

# Run the ultra-simple server
CMD ["node", "production-server.js"]
