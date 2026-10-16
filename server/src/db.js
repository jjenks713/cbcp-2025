const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err);
  });

  // Environments share one Atlas cluster (one URI); MONGODB_DB_NAME picks
  // the database - e.g. prod sets cbcp2025-prod. Unset = whatever the URI says.
  const dbName = process.env.MONGODB_DB_NAME || undefined;
  await mongoose.connect(uri, { dbName });
  console.log(`[db] connected (${mongoose.connection.name})`);
}

module.exports = { connectDB };
