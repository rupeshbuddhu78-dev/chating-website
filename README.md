# QuickTalk

Production-ready Omegle / OmeTV / Chatroulette style anonymous random text, voice and video chat platform.

## Stack
Node.js, Express, MongoDB (Mongoose), Socket.IO, WebRTC, EJS, JWT, bcrypt, Passport Google OAuth, Cashfree Payments, node-cron.

## Quick start
```bash
cp .env.example .env
# fill values
npm install
npm start
```

## Deploy on Render
1. Push to GitHub.
2. Create a Web Service on Render pointing at the repo.
3. Add the env vars from `.env.example`.
4. Live URL: https://livegirlschat.online

## Folder structure
```
config/        DB, passport, constants
controllers/   Route logic
middleware/    Auth, admin, rate limit, errors
models/        Mongoose models
routes/        Express routes
socket/        Socket.IO matching, chat, WebRTC signaling
utils/         JWT, email, cashfree, helpers
views/         EJS templates
public/        Static assets (css, js, images)
uploads/       User uploads
```

## Features
- Anonymous random text / voice / video chat (WebRTC + Socket.IO)
- Auth: signup, login, JWT, Google OAuth, forgot / reset password, email verify
- Cashfree subscriptions: 10/20/30/99/599 INR plans
- Priority queue + gender / country / language filter for premium
- Admin panel: users, payments, reports, live rooms
- Reports, blocks, chat logs, settings
- Helmet, CORS, rate limit, sanitization, XSS, CSRF-safe cookies

## Cashfree plans
| Price | Days |
|-------|------|
| ₹10   | 2    |
| ₹20   | 4    |
| ₹30   | 7    |
| ₹99   | 30   |
| ₹599  | 365  |
