FROM node:14-alpine

WORKDIR /app

# Copy server file
COPY server.js .

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
