FROM node:18

WORKDIR /app

# Copy server.js first
COPY server.js ./

# Install only required dependencies
RUN npm install express

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]
