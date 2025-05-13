FROM node:18

WORKDIR /app

# Copy the server file
COPY server.js ./

# Install only express (minimal dependency)
RUN npm install express

# Expose the port
EXPOSE 8080

# Run the server
CMD ["node", "server.js"]
