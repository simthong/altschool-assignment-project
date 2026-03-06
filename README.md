# Scissor Full-Stack App

This project is now a full-stack web application with:
- Node.js + Express backend
- MongoDB persistence (users + transactions)
- JWT authentication (signup/login/me)
- Stripe Checkout payment integration
- Frontend wired to backend APIs

## Project Structure

- `server.js` - Express server and static hosting
- `routes/auth.js` - Signup/login/profile APIs
- `routes/payment.js` - Stripe checkout, webhook, history, confirmation
- `models/User.js` - User schema
- `models/Transaction.js` - Payment transaction schema
- `middleware/auth.js` - JWT auth middleware
- `index.html`, `style.css`, `app.js` - Frontend and API integration
- `.env.example` - Environment variables template
- `render.yaml` - Render deployment blueprint

## API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)

### Payments
- `POST /api/payments/create-checkout-session` (Bearer token required)
- `GET /api/payments/confirm-session/:sessionId` (Bearer token required)
- `GET /api/payments/history` (Bearer token required)
- `POST /api/payments/webhook` (Stripe webhook)

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env
   ```
3. Set env values in `.env`.
4. Start server:
   ```bash
   npm start
   ```

## Render Deployment

1. Push repo to GitHub.
2. Create a **Web Service** on Render using this repo.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables from `.env.example`.
5. Configure Stripe webhook URL:
   - `https://<your-render-domain>/api/payments/webhook`

## End-to-End Flow

1. Sign up from the portal form.
2. Log in.
3. Click a payment button.
4. Complete payment in Stripe Checkout.
5. Redirect returns to app and confirms transaction status.
