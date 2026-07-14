/**
 * QuickTalk - Production server
 * ---------------------------------------------------------
 * Anonymous random text + voice + video chat platform.
 * Express + MongoDB + Socket.IO + WebRTC signaling.
 */

require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const { seedDefaults } = require('./config/seed');
const { globalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/error');
const notFound = require('./middleware/notFound');
const attachUser = require('./middleware/attachUser');
const startCrons = require('./utils/cron');
const registerSockets = require('./socket');

// ---- Routes ----
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// ---- Trust proxy (Render / Cloudflare) ----
app.set('trust proxy', 1);

// ---- View engine ----
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ---- Security ----
app.use(
  helmet({
    contentSecurityPolicy: false, // allow inline scripts/styles for EJS + socket.io client
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true
  })
);
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(globalLimiter);

// ---- Body / cookies ----
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// ---- Sessions (for Google OAuth flow) ----
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'quicktalk-session',
    resave: false,
    saveUninitialized: false,
    store: process.env.MONGO_URI
      ? MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions' })
      : undefined,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

// ---- Passport ----
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// ---- Static ----
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d' }));

// ---- Attach user (from JWT cookie) to res.locals ----
app.use(attachUser);

// ---- Health ----
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- Routes ----
app.use('/', pageRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// ---- 404 + Errors ----
app.use(notFound);
app.use(errorHandler);

// ---- Socket.IO ----
const io = new Server(server, {
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});
app.set('io', io);
registerSockets(io);

// ---- Boot ----
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  await seedDefaults();
  startCrons();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[QuickTalk] listening on 0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
})();

// ---- Graceful crash handling ----
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
