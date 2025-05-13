// This is a simple wrapper to ensure the server listens on the correct port for Cloud Run
import express from "express";
import { registerRoutes } from "./routes.js"; // Note the .js extension for ESM in production
import { serveStatic } from "./vite.js"; // Note the .js extension for ESM in production

// For production, we need to import the compiled JS files (not TS)
// This file will be built to dist/server.js and run in production

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log HTTP requests (simplified for production)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Error handling middleware
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`Error: ${message}`);
      res.status(status).json({ message });
    });
    
    // In production, serve static files
    serveStatic(app);

    // Get port from environment variable (required for Cloud Run)
    const port = process.env.PORT || 8080;
    
    server.listen({
      port,
      host: "0.0.0.0"
    }, () => {
      console.log(`Server is running on port ${port}`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
