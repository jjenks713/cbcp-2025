const dotenv = require('dotenv');
// .env is tracked (blank placeholders, repo is public); .env.local is
// gitignored and holds real local values, loaded after so it overrides.
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);

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
