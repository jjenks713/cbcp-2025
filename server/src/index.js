const dotenv = require('dotenv');
// .env is tracked (blank placeholders, repo is public); .env.local is
// gitignored and holds real local values, loaded after so it overrides.
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./db');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminContentfulRoutes = require('./routes/admin-contentful');
const adminInventoryRoutes = require('./routes/admin-inventory');

// Sites whose pages may call the API from the browser - local dev, the prod
// custom domain, plus the prod and dev frontends (each Cloud Run service
// answers on two URLs). CORS_ORIGINS (comma-separated) replaces the list.
// Requests with no Origin (curl, health checks) aren't affected.
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'https://creepybutcutepress.com',
  'https://www.creepybutcutepress.com',
  'https://cbcp-2025-4wcjicbaua-uc.a.run.app',
  'https://cbcp-2025-561828277789.us-central1.run.app',
  'https://cbcp-2025-dev-4wcjicbaua-uc.a.run.app',
  'https://cbcp-2025-dev-561828277789.us-central1.run.app',
];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_CORS_ORIGINS;

const app = express();
// Cloud Run sits behind one Google proxy - trust its X-Forwarded-For so
// req.ip (used by the login rate limit) is the visitor, not the proxy.
app.set('trust proxy', 1);
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin/contentful', adminContentfulRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);

const PORT = process.env.PORT || 8080;

if (!process.env.JWT_SECRET) {
  console.error('[server] JWT_SECRET is not set');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('[server] failed to connect to MongoDB:', err);
    process.exit(1);
  });
