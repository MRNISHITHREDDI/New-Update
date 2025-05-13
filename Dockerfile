FROM node:18-slim

WORKDIR /app

# Copy server file
COPY server.js ./

# Install express
RUN npm install express

# Expose port
EXPOSE 8080

# Run the application
CMD ["node", "server.js"]
