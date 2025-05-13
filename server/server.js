// Ultra-simple server for Cloud Run
const express = require('express');

// Create Express app
const app = express();

// Root endpoint
app.get('/', (req, res) => {
  res.send('Server is running on Cloud Run!');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gift code endpoint (minimal API example)
app.get('/api/gift-code', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      giftCode: "4033F8A7A14DE9DC179CDD9942EF52F6" 
    } 
  });
});

// Listen on the port provided by Cloud Run
const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
