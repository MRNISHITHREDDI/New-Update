// Extremely simplified server for Google Cloud Run
const express = require('express');

// Create minimal app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Very basic API endpoint
app.get('/api/gift-code', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      giftCode: "4033F8A7A14DE9DC179CDD9942EF52F6" 
    } 
  });
});

// Get the port from the environment variable (required for Cloud Run)
const PORT = parseInt(process.env.PORT) || 8080;

// Listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
