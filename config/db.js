const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas / local Mongo.
 */
module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[DB] MONGO_URI missing — running without database (features will fail).');
    return;
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 20
    });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    // do not exit — allow health endpoint to remain responsive on Render
  }
};
