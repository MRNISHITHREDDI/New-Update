// Simple express server for Cloud Run deployment
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Sample data
const storage = {
  verifications: [
    {
      id: 1,
      jalwaUserId: '12345',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Auto-approved'
    },
    {
      id: 2,
      jalwaUserId: '56789',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  giftCode: "4033F8A7A14DE9DC179CDD9942EF52F6"
};

// API Routes
app.get('/', (req, res) => {
  res.send('Jalwa API Server is running!');
});

app.get('/api/gift-code', (req, res) => {
  res.json({ success: true, data: { giftCode: storage.giftCode } });
});

app.get('/api/admin/account-verifications', (req, res) => {
  res.json({ success: true, data: storage.verifications });
});

app.get('/api/admin/account-verifications/status/:status', (req, res) => {
  const { status } = req.params;
  const filtered = storage.verifications.filter(v => v.status === status);
  res.json({ success: true, data: filtered });
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
  
  // Check if already verified
  const existing = storage.verifications.find(v => v.jalwaUserId === jalwaUserId);
  if (existing) {
    return res.json({
      success: true,
      message: 'Account verification status retrieved',
      isVerified: existing.status === 'approved',
      status: existing.status,
      userId: jalwaUserId
    });
  }
  
  // Auto-approve for demo users
  const approvedUserIds = ['12345', '56789', 'admin123', 'approved_test_user'];
  const approved = approvedUserIds.includes(jalwaUserId);
  const status = approved ? 'approved' : 'pending';
  
  // Create new verification
  const newVerification = {
    id: storage.verifications.length + 1,
    jalwaUserId,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: approved ? 'Auto-approved' : undefined
  };
  
  storage.verifications.push(newVerification);
  
  return res.json({
    success: true,
    message: approved ? 'Account verified automatically' : 'Verification pending admin approval',
    isVerified: approved,
    status,
    userId: jalwaUserId
  });
});

// Start server
const PORT = parseInt(process.env.PORT) || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
