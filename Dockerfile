FROM node:16-slim

WORKDIR /app

# Copy server file
COPY server.js .

# Install express
RUN npm install express

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
