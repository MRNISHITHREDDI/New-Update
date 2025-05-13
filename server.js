// Enhanced server for Google Cloud Run
const express = require('express');

// Create minimal app
const app = express();
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple in-memory storage
const storage = {
  verifications: [
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
  ],
  giftCode: "4033F8A7A14DE9DC179CDD9942EF52F6",
  
  getAllAccountVerifications() {
    return this.verifications;
  },
  
  getAccountVerificationsByStatus(status) {
    return this.verifications.filter(v => v.status === status);
  },
  
  updateAccountVerificationStatus(id, status, notes) {
    const index = this.verifications.findIndex(v => v.id === parseInt(id));
    if (index === -1) return undefined;
    
    this.verifications[index] = {
      ...this.verifications[index],
      status,
      notes: notes || this.verifications[index].notes,
      updatedAt: new Date().toISOString()
    };
    
    return this.verifications[index];
  },
  
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
  },
  
  getGiftCode() {
    return this.giftCode;
  },
  
  updateGiftCode(newCode) {
    this.giftCode = newCode;
    return this.giftCode;
  }
};

// API Routes
app.get('/api/admin/account-verifications', (req, res) => {
  res.json({ success: true, data: storage.getAllAccountVerifications() });
});

app.get('/api/admin/account-verifications/status/:status', (req, res) => {
  const { status } = req.params;
  res.json({ success: true, data: storage.getAccountVerificationsByStatus(status) });
});

app.post('/api/admin/account-verification/:id/approve', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const result = storage.updateAccountVerificationStatus(id, 'approved', notes);
  if (result) {
    res.json({ success: true, data: result });
  } else {
    res.status(404).json({ success: false, message: 'Verification not found' });
  }
});

app.post('/api/admin/account-verification/:id/reject', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const result = storage.updateAccountVerificationStatus(id, 'rejected', notes);
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
  
  const result = storage.verifyJalwaAccount(jalwaUserId);
  res.json(result);
});

app.get('/api/gift-code', (req, res) => {
  const giftCode = storage.getGiftCode();
  res.json({ success: true, data: { giftCode } });
});

app.post('/api/admin/gift-code', (req, res) => {
  const { giftCode } = req.body;
  
  if (!giftCode) {
    return res.status(400).json({ success: false, message: 'Missing giftCode' });
  }
  
  const newCode = storage.updateGiftCode(giftCode);
  res.json({ success: true, data: { giftCode: newCode } });
});

// Health checks and root page
app.get('/', (req, res) => {
  res.status(200).send(`
    <html>
      <head>
        <title>Jalwa API Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .endpoint { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          .method { font-weight: bold; color: #0066cc; }
          .url { font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>Jalwa API Server</h1>
        <p>The API server is running successfully! Here are the available endpoints:</p>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/gift-code</span> - Get the current gift code
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/admin/account-verifications</span> - Get all account verifications
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/admin/account-verifications/status/:status</span> - Get verifications by status
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/admin/account-verification/:id/approve</span> - Approve a verification
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/admin/account-verification/:id/reject</span> - Reject a verification
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/verify-account</span> - Verify a Jalwa user account
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/admin/gift-code</span> - Update the gift code
        </div>
      </body>
    </html>
  `);
});

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

// Get the port from the environment variable (required for Cloud Run)
const PORT = parseInt(process.env.PORT) || 8080;

// Listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
