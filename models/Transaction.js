const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    plan: { type: String, enum: ['professional', 'teams'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    sessionId: { type: String, required: true },
    paymentIntentId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
