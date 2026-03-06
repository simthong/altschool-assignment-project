require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3000;

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes.webhookHandler);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use('/api/auth', authRoutes.router);
app.use('/api/payments', paymentRoutes.router);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const startServer = async () => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'APP_BASE_URL'];
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
