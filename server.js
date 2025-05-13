// Simple express server for Google Cloud Run deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create minimal storage implementation
class SimpleStorage {
  constructor() {
    this.verifications = [
      {
        id: 1,
        jalwaUserId: '12345',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'Auto-approved in cloud deployment'
      },
      {
        id: 2,
        jalwaUserId: '56789',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    this.giftCode = "4033F8A7A14DE9DC179CDD9942EF52F6";
  }
  
  getAllAccountVerifications() {
    return this.verifications;
  }
  
  getAccountVerificationsByStatus(status) {
    return this.verifications.filter(v => v.status === status);
  }
  
  updateAccountVerificationStatus(id, status, notes) {
    const index = this.verifications.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    
    this.verifications[index] = {
      ...this.verifications[index],
      status,
      notes: notes || this.verifications[index].notes,
      updatedAt: new Date().toISOString()
    };
    
    return this.verifications[index];
  }
  
  verifyJalwaAccount(jalwaUserId) {
    const approvedUserIds = ['12345', '56789', 'admin123', 'approved_test_user'];
    
    // Check if already verified
    const existing = this.verifications.find(v => v.jalwaUserId === jalwaUserId);
    if (existing) {
      return {
        success: true,
        message: 'Account verification status retrieved',
        isVerified: existing.status === 'approved',
        status: existing.status,
        userId: jalwaUserId
      };
    }
    
    // Auto-approve for demo users
    const approved = approvedUserIds.includes(jalwaUserId);
    const status = approved ? 'approved' : 'pending';
    
    // Create new verification
    const newVerification = {
      id: this.verifications.length + 1,
      jalwaUserId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: approved ? 'Auto-approved in cloud deployment' : undefined
    };
    
    this.verifications.push(newVerification);
    
    return {
      success: true,
      message: approved ? 'Account verified automatically' : 'Verification pending admin approval',
      isVerified: approved,
      status,
      userId: jalwaUserId
    };
  }
  
  getGiftCode() {
    return this.giftCode;
  }
  
  updateGiftCode(newCode) {
    this.giftCode = newCode;
    return this.giftCode;
  }
}

const storage = new SimpleStorage();
const app = express();
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API endpoints
app.get('/api/admin/account-verifications', (req, res) => {
  console.log('Getting all verifications');
  res.json({ success: true, data: storage.getAllAccountVerifications() });
});

app.get('/api/admin/account-verifications/status/:status', (req, res) => {
  const { status } = req.params;
  console.log(`Getting verifications with status: ${status}`);
  res.json({ success: true, data: storage.getAccountVerificationsByStatus(status) });
});

app.post('/api/admin/account-verification/:id/approve', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  console.log(`Approving verification ${id}`);
  const result = storage.updateAccountVerificationStatus(parseInt(id), 'approved', notes);
  if (result) {
    res.json({ success: true, data: result });
  } else {
    res.status(404).json({ success: false, message: 'Verification not found' });
  }
});

app.post('/api/admin/account-verification/:id/reject', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  console.log(`Rejecting verification ${id}`);
  const result = storage.updateAccountVerificationStatus(parseInt(id), 'rejected', notes);
  if (result) {
    res.json({ success: true, data: result });
  } else {
    res.status(404).json({ success: false, message: 'Verification not found' });
  }
});

app.post('/api/verify-account', (req, res) => {
  const { jalwaUserId } = req.body;
  
  if (!jalwaUserId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing jalwaUserId',
      isVerified: false
    });
  }
  
  console.log(`Verifying account for user: ${jalwaUserId}`);
  const result = storage.verifyJalwaAccount(jalwaUserId);
  res.json(result);
});

app.get('/api/gift-code', (req, res) => {
  console.log('Getting gift code');
  const giftCode = storage.getGiftCode();
  res.json({ success: true, data: { giftCode } });
});

app.post('/api/admin/gift-code', (req, res) => {
  const { giftCode } = req.body;
  
  if (!giftCode) {
    return res.status(400).json({ success: false, message: 'Missing giftCode' });
  }
  
  console.log(`Updating gift code to: ${giftCode}`);
  const newCode = storage.updateGiftCode(giftCode);
  res.json({ success: true, data: { giftCode: newCode } });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Try to serve static files from dist/client
const distClientPath = path.join(__dirname, 'dist', 'client');
if (fs.existsSync(distClientPath)) {
  console.log(`Static files will be served from: ${distClientPath}`);
  app.use(express.static(distClientPath));
  
  // Serve index.html for all other routes (for client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distClientPath, 'index.html'));
  });
} else {
  console.warn(`Warning: ${distClientPath} directory not found. Static files will not be served.`);
  app.get('*', (_req, res) => {
    res.status(200).send('<h1>Jalwa API Server</h1><p>API endpoints available at /api/...</p>');
  });
}

// Get the port from the environment variable (required for Cloud Run)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});
