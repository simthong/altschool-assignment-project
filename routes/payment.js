const express = require('express');
const Stripe = require('stripe');

const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const planPricing = {
  professional: { amount: 1500, label: 'Professional Plan' },
  teams: { amount: 2500, label: 'Teams Plan' }
};

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    const selectedPlan = planPricing[plan];

    if (!selectedPlan) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const baseUrl = process.env.APP_BASE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: selectedPlan.amount,
            product_data: {
              name: selectedPlan.label
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: req.user.id,
        plan
      },
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?payment=cancelled`
    });

    await Transaction.create({
      user: req.user.id,
      email: req.user.email,
      plan,
      amount: selectedPlan.amount,
      currency: 'usd',
      status: 'pending',
      sessionId: session.id
    });

    return res.json({ checkoutUrl: session.url });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to start payment' });
  }
});

router.get('/confirm-session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transaction = await Transaction.findOne({ sessionId, user: req.user.id });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      transaction.status = 'paid';
      transaction.paymentIntentId = session.payment_intent;
      await transaction.save();
    }

    return res.json({
      status: transaction.status,
      transaction: {
        plan: transaction.plan,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to confirm payment status' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
  return res.json({ transactions });
});

const webhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await Transaction.findOneAndUpdate(
        { sessionId: session.id },
        {
          status: 'paid',
          paymentIntentId: session.payment_intent
        }
      );
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

module.exports = { router, webhookHandler };
