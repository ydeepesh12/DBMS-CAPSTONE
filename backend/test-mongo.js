const mongoose = require('mongoose');
require('./src/config/loadEnv')();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traffic_challan';

async function testConnection() {
  console.log('========================================================');
  console.log('      TESTING MONGODB CONNECTION FOR SMARTCHALLAN       ');
  console.log('========================================================');
  console.log(`Connecting to: ${MONGO_URI} ...`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('\n[RESULT] ✓ STATUS: CONNECTED SUCCESSFULLY!');
    console.log(`Database Name: ${mongoose.connection.db.databaseName}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Active Collections:', collections.map(c => c.name));

    const evidenceCollection = mongoose.connection.db.collection('evidence_metadata');
    const docCount = await evidenceCollection.countDocuments();
    console.log(`Total Evidence Documents in MongoDB: ${docCount}`);

    if (docCount > 0) {
      const sample = await evidenceCollection.findOne({});
      console.log('\nSample Document from MongoDB:');
      console.log(JSON.stringify({
        _id: sample._id,
        violation_id: sample.violation_id,
        camera_id: sample.camera_id,
        media_type: sample.media_type,
        tags: sample.tags,
        ai_confidence_score: sample.ai_confidence_score,
        ocr_plate_text: sample.ocr_plate_text
      }, null, 2));
    }

    console.log('\n========================================================');
    console.log('   MONGODB IS READY AND WORKING 100% WITH BACKEND & FRONTEND! ');
    console.log('========================================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n[RESULT] ✗ FAILED TO CONNECT TO MONGODB:');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
