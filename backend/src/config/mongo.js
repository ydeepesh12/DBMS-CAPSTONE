const mongoose = require('mongoose');
require('./loadEnv')();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traffic_challan';

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGO_URI);
    const count = await mongoose.connection.db.collection('evidence_metadata').countDocuments().catch(() => 0);
    console.log('=====================================================');
    console.log(`[MongoDB] ✓ Connected successfully to: ${MONGO_URI}`);
    console.log(`[MongoDB] Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`[MongoDB] Collection 'evidence_metadata' documents: ${count}`);
    console.log('=====================================================');
    return true;
  } catch (err) {
    console.error(`[MongoDB] ✗ Connection error: ${err.message}`);
    return false;
  }
}

async function getMongoStatus() {
  const isConnected = mongoose.connection.readyState === 1;
  let count = 0;
  let collections = [];
  if (isConnected) {
    try {
      count = await mongoose.connection.db.collection('evidence_metadata').countDocuments();
      const cols = await mongoose.connection.db.listCollections().toArray();
      collections = cols.map(c => c.name);
    } catch (e) {}
  }
  return {
    connected: isConnected,
    state: isConnected ? 'CONNECTED' : 'DISCONNECTED',
    uri: MONGO_URI,
    database: isConnected ? mongoose.connection.db.databaseName : null,
    totalEvidenceDocuments: count,
    collections
  };
}

module.exports = {
  connectMongoDB,
  getMongoStatus,
  mongoose
};
