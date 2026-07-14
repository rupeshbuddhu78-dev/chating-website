# QuickTalk

> **Anonymous Random Text, Voice & HD Video Chat Platform**
> Production-ready alternative to Omegle, OmeTV & Chatroulette.
> Live domain: **https://livegirlschat.online**

QuickTalk ek complete anonymous random chat platform hai jisme users ek dusre se text, voice ya HD video pe baat kar sakte hain — bilkul Omegle jaisa, but modern, secure aur premium features ke saath.

---

## Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Complete Folder Structure](#-complete-folder-structure)
4. [File-by-File Explanation](#-file-by-file-explanation)
5. [Environment Variables](#-environment-variables)
6. [Local Setup](#-local-setup)
7. [Render Deployment](#-render-deployment)
8. [Cashfree Payment Integration](#-cashfree-payment-integration)
9. [SEO Configuration](#-seo-configuration)
10. [Security](#-security)
11. [Admin Panel](#-admin-panel)
12. [API Endpoints](#-api-endpoints)
13. [Socket.IO Events](#-socketio-events)
14. [Troubleshooting](#-troubleshooting)

---

## Features

### Anonymous Chat
- Random 1:1 matching (Omegle-style)
- Text chat with emoji, image, GIF, sticker support (max image size 350 KB)
- HD Video chat via WebRTC (peer-to-peer)
- Voice-only mode
- Next / Stop / Skip / Report / Block
- Typing indicator, online counter, connection status
- Auto-reconnect on disconnect

### Authentication
- Signup / Login / Logout with JWT + bcrypt
- Google OAuth (Passport.js)
- Email verification
- Forgot password + reset via email
- Secure httpOnly cookies

### Premium (Cashfree Payment)
| Price | Duration |
|-------|----------|
| ₹10   | 2 Days   |
| ₹20   | 4 Days   |
| ₹30   | 7 Days   |
| ₹99   | 30 Days  |
| ₹599  | 365 Days |

- Server-side order creation
- Webhook with HMAC-SHA256 signature verification
- Auto premium activation on payment
- Hourly cron job to expire premium
- Payment history + CSV export

### Premium Perks
- HD video priority
- Gender filter
- Country filter
- Language filter
- Priority queue matching
- Ad-free experience
- Premium badge

### Admin Panel
- Dashboard stats (users, revenue, online, reports)
- User management (ban / unban / delete / grant premium)
- Payment tracking + CSV export
- Report review (dismiss / action / ban)
- Live chat status (waiting queue, active rooms)
- Site settings (maintenance, image limit, etc.)

### SEO & PWA
- Per-page `<title>`, meta description, keywords
- Open Graph + Twitter Cards
- JSON-LD structured data (Organization, WebSite, WebApplication, FAQ, Breadcrumb)
- `robots.txt`, `sitemap.xml`, `manifest.json`, `humans.txt`, `security.txt`
- OG image (1200×630)
- Canonical URLs + hreflang

---

## Tech Stack

**Frontend**
- HTML5, CSS3 (dark modern theme), Vanilla JavaScript
- EJS templating with `express-ejs-layouts`
- Socket.IO client
- WebRTC + `webrtc-adapter.js`

**Backend**
- Node.js (>=18), Express.js
- MongoDB Atlas + Mongoose
- Socket.IO (WebSocket + polling)
- JWT, bcryptjs, Passport (Google OAuth)
- Cashfree Payment Gateway v2022-09-01
- Nodemailer (SMTP)
- node-cron (scheduled jobs)

**Security**
- Helmet, CORS, express-rate-limit
- express-mongo-sanitize, xss-clean, hpp
- Signed cookies, session store in MongoDB
- Webhook signature verification (HMAC-SHA256)

**Deployment**
- Render (Web Service)
- MongoDB Atlas
- Cashfree PROD environment

---

## Complete Folder Structure

```
quicktalk/
│
├── server.js                        # ⭐ Main entry — Express + Socket.IO boot
├── package.json                     # Dependencies + npm scripts
├── package-lock.json                # (created after npm install)
├── .env.example                     # Sample env vars — copy to .env
├── .gitignore                       # Ignore node_modules, .env, uploads
├── render.yaml                      # Render deployment config
├── README.md                        # ← You are here
│
├── config/                          # 🔧 Configuration & seed data
│   ├── db.js                        #    → MongoDB connection
│   ├── passport.js                  #    → Google OAuth strategy
│   ├── constants.js                 #    → Plans, genders, ICE servers, limits
│   ├── seo.js                       #    → Per-route SEO metadata
│   └── seed.js                      #    → Boot-time seed (admin, plans, settings)
│
├── models/                          # 📦 Mongoose models
│   ├── User.js                      #    → name, email, password, gender, premium…
│   ├── Admin.js                     #    → Separate admin accounts
│   ├── Payment.js                   #    → orderId, cfOrderId, plan, status, raw
│   ├── Report.js                    #    → reporter, reason, status
│   ├── Block.js                     #    → blocker → blockedUser mapping
│   ├── ChatLog.js                   #    → roomId, participants, mode, messages
│   ├── PremiumPlan.js               #    → Plan catalogue
│   ├── PasswordReset.js             #    → Reset tokens (TTL-indexed)
│   └── Settings.js                  #    → Site-wide settings
│
├── middleware/                      # 🛡️ Express middlewares
│   ├── auth.js                      #    → protect() JWT + requirePremium()
│   ├── admin.js                     #    → Admin cookie guard
│   ├── attachUser.js                #    → Attach current user to res.locals
│   ├── upload.js                    #    → Multer (350KB image cap)
│   ├── rateLimit.js                 #    → Global / auth / payment rate limits
│   ├── error.js                     #    → Global error handler
│   └── notFound.js                  #    → 404 handler
│
├── controllers/                     # 🎯 Request handlers (business logic)
│   ├── authController.js            #    → signup, login, verify, forgot, reset, google
│   ├── userController.js            #    → dashboard, profile, password, payments
│   ├── paymentController.js         #    → createOrder, return, webhook
│   ├── adminController.js           #    → All admin actions
│   └── pagesController.js           #    → Static pages (home, about, terms…)
│
├── routes/                          # 🚦 Express routers
│   ├── pages.js                     #    → Marketing + SEO endpoints
│   ├── auth.js                      #    → /auth/*
│   ├── user.js                      #    → /user/*
│   ├── payment.js                   #    → /payment/* (raw body for webhook)
│   ├── admin.js                     #    → /admin/*
│   └── api.js                       #    → /api/report, /api/block, /api/me
│
├── socket/                          # 🔌 Socket.IO (real-time)
│   ├── index.js                     #    → Registers all handlers
│   ├── matching.js                  #    → ⭐ Priority queue + filter + block-aware pairing
│   ├── chat.js                      #    → Text messages, typing, media-state
│   └── signal.js                    #    → WebRTC signaling relay (offer/answer/ICE)
│
├── utils/                           # 🧰 Reusable helpers
│   ├── jwt.js                       #    → signToken, sendTokenCookie, clearTokenCookie
│   ├── cashfree.js                  #    → createOrder, getOrder, verifyWebhookSignature
│   ├── email.js                     #    → Nodemailer transport
│   ├── cron.js                      #    → Hourly premium-expiry job
│   └── helpers.js                   #    → randomToken, anonName, sanitizeStr…
│
├── views/                           # 🖼️ EJS templates
│   ├── error.ejs                    #    → Generic error page
│   │
│   ├── layouts/                     # 🎨 Wrapper layouts
│   │   ├── main.ejs                 #    → Public site (header + footer)
│   │   ├── chat.ejs                 #    → Chat page (no site chrome)
│   │   └── admin.ejs                #    → Admin panel (sidebar)
│   │
│   ├── partials/                    # 🧩 Shared fragments
│   │   ├── header.ejs               #    → Top nav
│   │   ├── footer.ejs               #    → Site footer
│   │   └── seo.ejs                  #    → ⭐ Complete SEO <head> (meta, OG, JSON-LD)
│   │
│   ├── pages/                       # 🏠 Public pages
│   │   ├── home.ejs                 #    → Landing (hero, features, FAQ, CTA)
│   │   ├── chat.ejs                 #    → Chat UI (video + text + controls)
│   │   ├── about.ejs
│   │   ├── terms.ejs
│   │   ├── privacy.ejs
│   │   └── contact.ejs
│   │
│   ├── auth/                        # 🔐 Auth screens
│   │   ├── login.ejs
│   │   ├── signup.ejs
│   │   ├── forgot.ejs
│   │   └── reset.ejs
│   │
│   ├── dashboard/                   # 👤 User dashboard
│   │   ├── index.ejs                #    → Overview + plans
│   │   ├── premium.ejs              #    → Buy premium
│   │   ├── profile.ejs              #    → Edit profile + change password
│   │   └── payments.ejs             #    → Payment history
│   │
│   └── admin/                       # 🛠️ Admin panel views
│       ├── login.ejs
│       ├── dashboard.ejs
│       ├── users.ejs
│       ├── payments.ejs
│       ├── reports.ejs
│       ├── settings.ejs
│       └── chat.ejs                 #    → Live socket stats
│
├── public/                          # 🌐 Static assets
│   ├── css/
│   │   ├── main.css                 #    → Global styles (dark theme)
│   │   ├── chat.css                 #    → Chat + video styles
│   │   └── admin.css                #    → Admin panel styles
│   ├── js/
│   │   ├── main.js                  #    → Marketing pages (small)
│   │   ├── chat.js                  #    → ⭐ WebRTC + Socket.IO client
│   │   └── payment.js               #    → Cashfree SDK v3 checkout
│   └── images/
│       ├── favicon.svg
│       └── og-image.svg             #    → Social preview image
│
└── uploads/                         # 📁 User profile images (Multer)
    └── .gitkeep
```

---

## File-by-File Explanation

### Root files

| File | Purpose |
|------|---------|
| `server.js` | Boots Express, MongoDB, Passport, Socket.IO. Registers all middleware & routes. Starts hourly cron & seed. |
| `package.json` | Node dependencies (`express`, `mongoose`, `socket.io`, `bcryptjs`, `jsonwebtoken`, `passport`, `nodemailer`, `node-cron`, `axios`, `helmet`, `xss-clean`, `express-rate-limit`, …) |
| `.env.example` | Sample environment variables — copy to `.env` and fill values |
| `render.yaml` | Render Web Service config (build/start commands, env vars) |
| `.gitignore` | Ignores `node_modules`, `.env`, `uploads/*`, logs |

### config/ — Configuration

| File | Purpose |
|------|---------|
| `db.js` | Connects to MongoDB Atlas via `MONGO_URI` |
| `passport.js` | Registers Google OAuth 2.0 strategy |
| `constants.js` | `PREMIUM_PLANS`, `GENDERS`, `ICE_SERVERS`, image size limits |
| `seo.js` | Per-route SEO metadata (title, description, priority, changefreq). Powers `sitemap.xml` + `seo.ejs` partial |
| `seed.js` | On boot: creates default admin (from `.env`), inserts premium plans, initializes Settings doc |

### models/ — Mongoose schemas

| Model | Key fields |
|-------|-----------|
| `User` | name, email, password (hashed), googleId, gender, country, language, isPremium, premiumExpiry, banned, reportsCount |
| `Admin` | Separate admin table so admins ≠ users |
| `Payment` | orderId, cfOrderId, planCode, amount, status (CREATED/PENDING/PAID/FAILED/REFUNDED), raw webhook payload |
| `Report` | reporter, reportedUser, reason, roomId, status |
| `Block` | blocker → blockedUser (or anonId) |
| `ChatLog` | roomId, participants, mode, startedAt/endedAt, messagesCount |
| `PremiumPlan` | Plan catalogue (upsert-seeded) |
| `PasswordReset` | TTL-indexed reset tokens (auto-expire) |
| `Settings` | Site-wide toggles (maintenance mode, image cap, etc.) |

### middleware/

| File | Purpose |
|------|---------|
| `auth.js` | `protect()` — reads JWT cookie / Bearer header, loads user. `requirePremium()` — 402 if not premium. |
| `admin.js` | Reads `admin_token` cookie, verifies JWT with role=admin |
| `attachUser.js` | Non-blocking: attaches `req.user` + `res.locals.user` + default `res.locals.seo` for every request |
| `upload.js` | Multer disk storage, 350 KB image cap, only jpeg/png/webp/gif |
| `rateLimit.js` | 3 limiters: global (300/min), auth (30/15min), payment (20/min) |
| `error.js` | Catches errors, returns HTML or JSON depending on `Accept` / `/api` prefix |
| `notFound.js` | Renders 404 page |

### controllers/

| Controller | Handlers |
|-----------|----------|
| `authController.js` | `getSignup`, `signup`, `getLogin`, `login`, `logout`, `verify`, `getForgot`, `forgot`, `getReset`, `reset`, `googleSuccess` |
| `userController.js` | `dashboard`, `premiumPage`, `profilePage`, `updateProfile`, `changePassword`, `paymentsPage` |
| `paymentController.js` | `createOrder` (server-side Cashfree order), `paymentReturn` (verify on return), `webhook` (HMAC verify + activate) |
| `adminController.js` | `loginPage`, `doLogin`, `logout`, `dashboard`, `users`, `banUser`, `unbanUser`, `deleteUser`, `givePremium`, `removePremium`, `payments`, `exportPaymentsCSV`, `reports`, `actionReport`, `settingsPage`, `saveSettings`, `chatStatus` |
| `pagesController.js` | `home`, `about`, `terms`, `privacy`, `contact`, `chatPage` (with ICE servers) |

### routes/

| Route file | Mounts |
|-----------|--------|
| `pages.js` | `/`, `/chat`, `/about`, `/terms`, `/privacy`, `/contact`, `/robots.txt`, `/sitemap.xml`, `/sitemap-index.xml`, `/manifest.json`, `/browserconfig.xml`, `/humans.txt`, `/ads.txt`, `/.well-known/security.txt` |
| `auth.js` | `/auth/signup`, `/login`, `/logout`, `/forgot`, `/reset/:token`, `/verify/:token`, `/google`, `/google/callback` |
| `user.js` | (protected) `/user/dashboard`, `/premium`, `/profile`, `/password`, `/payments` |
| `payment.js` | `/payment/create` (POST), `/payment/return`, `/payment/webhook` (raw body!) |
| `admin.js` | `/admin/login`, `/admin/*` (guarded) |
| `api.js` | `/api/me`, `/api/report`, `/api/block` |

### socket/ — Real-time layer

| File | Purpose |
|------|---------|
| `index.js` | Registers all Socket.IO handlers, broadcasts online count every 10 s |
| `matching.js` | **⭐ Core matching engine.** Dual priority queue (premium first + free), filters (gender/country/language), block-aware, room creation with unique roomId, ChatLog persistence |
| `chat.js` | Handles `join`, `next`, `stop`, `chat-message` (text/image/emoji/sticker), `typing`, `media-state` |
| `signal.js` | Relays WebRTC `signal` payloads (offer / answer / ICE candidate) + `call-quality` reports |

### utils/

| File | Purpose |
|------|---------|
| `jwt.js` | `signToken()`, `sendTokenCookie()`, `clearTokenCookie()` — httpOnly + secure in prod |
| `cashfree.js` | Cashfree v2022-09-01 wrapper. `createOrder()`, `getOrder()`, `verifyWebhookSignature()` (HMAC-SHA256 base64 with `timestamp + rawBody`) |
| `email.js` | Nodemailer SMTP transport (lazy-init). Skips if SMTP env vars missing |
| `cron.js` | Every hour: expires premium accounts whose `premiumExpiry <= now` |
| `helpers.js` | `randomToken`, `anonName`, `sanitizeStr`, `daysFromNow` |

### views/ — EJS templates

**Layouts** (`views/layouts/`)
- `main.ejs` — public site wrapper (header + footer + SEO partial)
- `chat.ejs` — chat page wrapper (loads socket.io + webrtc-adapter)
- `admin.ejs` — admin sidebar wrapper

**Partials** (`views/partials/`)
- `header.ejs` — top nav (Chat / About / Dashboard / Login / Premium CTA)
- `footer.ejs` — footer links
- `seo.ejs` — **complete SEO `<head>`**: title, description, keywords, robots, canonical, hreflang, Open Graph, Twitter Card, Apple mobile meta, PWA manifest link, JSON-LD (Organization + WebSite SearchAction + WebApplication with Offers + BreadcrumbList + FAQPage)

**Pages** (`views/pages/`)
- `home.ejs` — Hero, feature cards, "How it works" steps, FAQ (`<details>`), CTA. Uses semantic HTML for SEO
- `chat.ejs` — Landing form (name/gender/mode/premium filters) + chat screen (videos, messages, controls, report modal)
- `about.ejs`, `terms.ejs`, `privacy.ejs`, `contact.ejs` — Static content

**Auth** (`views/auth/`)
- `login.ejs`, `signup.ejs`, `forgot.ejs`, `reset.ejs`

**Dashboard** (`views/dashboard/`)
- `index.ejs` — greeting, premium badge, plan grid (buy button → Cashfree)
- `premium.ejs` — Full plans page
- `profile.ejs` — Edit profile + change password
- `payments.ejs` — Payment history table

**Admin** (`views/admin/`)
- `login.ejs`
- `dashboard.ejs` — Stat cards (users, revenue, online, reports)
- `users.ejs` — Search + ban / unban / delete / +premium / -premium
- `payments.ejs` — Search + CSV export
- `reports.ejs` — Dismiss / Ban user actions
- `settings.ejs` — Site settings form
- `chat.ejs` — Live socket stats (auto-refresh 5 s)

### public/

**`public/css/`**
- `main.css` — Dark modern theme (CSS variables, glassmorphism header, gradient orbs, plan cards, tables, responsive breakpoints)
- `chat.css` — Chat & video layout (side-by-side stage, PIP local video, emoji picker, modal, media controls)
- `admin.css` — Sidebar admin layout, stat grid

**`public/js/`**
- `main.js` — Small (marketing pages)
- `chat.js` — **⭐ Client-side chat engine.** Manages Socket.IO connection, WebRTC RTCPeerConnection, getUserMedia, offer/answer/ICE flow, emoji picker, image send (350 KB check), report/block, next/stop, camera swap, fullscreen, quality monitor
- `payment.js` — Cashfree SDK v3 checkout. `POST /payment/create` → gets `paymentSessionId` → opens Cashfree checkout

**`public/images/`**
- `favicon.svg` — QT gradient logo
- `og-image.svg` — 1200×630 Open Graph preview

### uploads/
- User profile images (uploaded via Multer). `.gitkeep` keeps the folder in git

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

```env
# Server
NODE_ENV=production
PORT=3000
BASE_URL=https://livegirlschat.online

# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/quicktalk

# JWT + Session
JWT_SECRET=<strong random string>
JWT_EXPIRES_IN=30d
COOKIE_EXPIRES_IN=30
SESSION_SECRET=<another strong string>

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://livegirlschat.online/auth/google/callback

# Cashfree
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=PROD
CASHFREE_WEBHOOK_SECRET=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=QuickTalk <no-reply@livegirlschat.online>

# Admin
ADMIN_EMAIL=admin@livegirlschat.online
ADMIN_PASSWORD=<strong password>

# TURN (optional, for WebRTC behind NAT)
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=
```

---

## Local Setup

```bash
git clone <repo>
cd quicktalk
cp .env.example .env      # fill env values
npm install
npm start                  # http://localhost:3000
```

Dev mode with auto-restart:
```bash
npm run dev
```

---

## Render Deployment

1. Push code to GitHub.
2. Render Dashboard → **New Web Service** → point at repo.
3. Settings applied automatically from `render.yaml`:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Health check: `/health`
4. Add env vars (already visible in your Render Environment tab).
5. In Cashfree Dashboard → set webhook URL:
   ```
   https://livegirlschat.online/payment/webhook
   ```
6. Login as admin → `https://livegirlschat.online/admin/login`

---

## Cashfree Payment Integration

**Flow:**
1. User clicks `Buy` → `POST /payment/create` with `planCode`
2. Server creates order via Cashfree API → returns `paymentSessionId`
3. Client calls `cashfree.checkout({ paymentSessionId })`
4. User pays → Cashfree redirects to `/payment/return?order_id=…`
5. Server verifies order status via `getOrder()` → activates premium
6. Cashfree also POSTs webhook → `/payment/webhook`
7. Server verifies HMAC signature → activates premium (duplicate-safe)

**Webhook signature check (`utils/cashfree.js`):**
```js
signature = base64( HMAC_SHA256( timestamp + rawBody, secret ) )
```

---

## SEO Configuration

Every page uses `views/partials/seo.ejs`, driven by `config/seo.js`:

- `<title>`, meta description, keywords
- Canonical URL + hreflang (en, x-default)
- Open Graph tags (title, description, image 1200×630, url, site_name)
- Twitter Card `summary_large_image`
- Apple mobile web-app meta
- **JSON-LD**: Organization, WebSite (with SearchAction), WebApplication (with 6 priced Offers + AggregateRating 4.7 / 1284 reviews), BreadcrumbList, FAQPage

**SEO endpoints:**
| URL | Purpose |
|-----|---------|
| `/robots.txt` | Crawl rules |
| `/sitemap.xml` | URL list with `lastmod`, `changefreq`, `priority` |
| `/sitemap-index.xml` | Sitemap index |
| `/manifest.json` | PWA manifest |
| `/browserconfig.xml` | Windows tiles |
| `/humans.txt` | Team info |
| `/ads.txt` | Ad partners |
| `/.well-known/security.txt` | Security contact |

**Submit to search engines after deploy:**
- Google Search Console
- Bing Webmaster Tools

---

## Security

| Layer | Protection |
|-------|-----------|
| Helmet | Sets 15+ security headers |
| CORS | Same-origin + credentials |
| Rate limit | 300 req/min global, 30/15 min auth, 20/min payment |
| bcrypt | Password hashing (cost 12) |
| JWT | httpOnly + secure cookies |
| express-mongo-sanitize | Blocks NoSQL injection |
| xss-clean | Sanitizes user input |
| hpp | HTTP parameter pollution |
| Cashfree webhook | HMAC-SHA256 signature verified |
| Multer | 350 KB image cap + mime filter |
| Admin | Separate JWT cookie + role check |

---

## Admin Panel

Login: `/admin/login`

Sidebar sections:
- **Dashboard** — Stat cards (total users, premium, banned, online, payments, revenue, reports pending)
- **Users** — Search, ban/unban/delete, grant/revoke premium
- **Payments** — Search + CSV export
- **Reports** — Review, dismiss, action, ban
- **Live Chat** — Waiting queue + active rooms (auto-refresh)
- **Settings** — Site name, maintenance mode, image limit, allow-video-for-free toggle

Default admin created from `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars.

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Landing page |
| GET | `/chat` | Chat page |
| GET | `/about` `/terms` `/privacy` `/contact` | Static pages |
| GET | `/health` | JSON `{ok:true}` |
| GET | `/robots.txt` `/sitemap.xml` `/manifest.json` | SEO |

### Auth

| Method | Path |
|--------|------|
| GET/POST | `/auth/signup` |
| GET/POST | `/auth/login` |
| GET | `/auth/logout` |
| GET | `/auth/verify/:token` |
| GET/POST | `/auth/forgot` |
| GET/POST | `/auth/reset/:token` |
| GET | `/auth/google` → `/auth/google/callback` |

### User (protected)

| Method | Path |
|--------|------|
| GET | `/user/dashboard` |
| GET | `/user/premium` |
| GET/POST | `/user/profile` |
| POST | `/user/password` |
| GET | `/user/payments` |

### Payment

| Method | Path |
|--------|------|
| POST | `/payment/create` |
| GET | `/payment/return` |
| POST | `/payment/webhook` (raw body — Cashfree only) |

### Admin (protected)

| Method | Path |
|--------|------|
| GET/POST | `/admin/login` |
| GET | `/admin` |
| GET | `/admin/users` |
| POST | `/admin/users/:id/ban` `/unban` `/delete` `/premium/give` `/premium/remove` |
| GET | `/admin/payments` `/payments.csv` |
| GET/POST | `/admin/reports` `/reports/:id` |
| GET/POST | `/admin/settings` |
| GET | `/admin/chat` |

### API

| Method | Path |
|--------|------|
| GET | `/api/me` (protected) |
| POST | `/api/report` |
| POST | `/api/block` (protected) |

---

## Socket.IO Events

### Client → Server

| Event | Payload |
|-------|---------|
| `join` | `{ userId?, isPremium, mode, name, gender, country, language, filters }` |
| `next` | (no payload) — leave partner + requeue |
| `stop` | (no payload) — leave partner |
| `chat-message` | `{ type: 'text'|'image'|'emoji'|'gif'|'sticker', text, data }` |
| `typing` | `boolean` |
| `signal` | `{ type: 'offer'|'answer'|'candidate', data }` (WebRTC) |
| `media-state` | `{ mic?, cam? }` |
| `call-quality` | `'Good'|'Fair'|'Poor'` |

### Server → Client

| Event | Payload |
|-------|---------|
| `welcome` | `{ id }` |
| `waiting` | — |
| `matched` | `{ roomId, partner, initiator }` |
| `partner-left` | — |
| `chat-message` | `{ type, text, data, at }` |
| `typing` | `boolean` |
| `signal` | Forwarded WebRTC payload |
| `online-count` | `number` (every 10 s) |
| `call-quality` | Forwarded |
| `error-msg` | `string` |

---

## Troubleshooting

**Video won't connect (peer behind NAT):**
Add TURN server to env (`TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD`). Free TURN options: metered.ca, Twilio.

**Cashfree webhook fails (invalid signature):**
- Ensure `CASHFREE_SECRET_KEY` matches PROD credentials.
- The webhook route uses `express.raw()` — the raw bytes are required for HMAC. Do NOT put `express.json()` above `/payment/webhook`.

**Google login redirect mismatch:**
- Google Cloud Console → OAuth → Authorized redirect URIs → add `https://livegirlschat.online/auth/google/callback`.

**Socket.IO not upgrading to WebSocket on Render:**
- Free tier supports WebSocket. If proxy blocks, we fall back to polling automatically (`transports: ['websocket','polling']`).

**Admin can't login:**
- On first boot, `config/seed.js` creates admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD`. If already exists it won't overwrite — delete manually in Mongo or change email.

**Emails not sending:**
- Fill `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`. For Gmail use an App Password.

---

## License

MIT — build, ship, remix freely.

## Support

- Email: `support@livegirlschat.online`
- Security: `security@livegirlschat.online`
- Domain: **https://livegirlschat.online**
