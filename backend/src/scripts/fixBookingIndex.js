import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
    console.log('Connected to MongoDB database:', mongoose.connection.db.databaseName);

    const bookingsColl = mongoose.connection.collection('bookings');

    try {
      await bookingsColl.dropIndex('userId_1_liveSessionId_1');
      console.log('✓ Dropped old userId_1_liveSessionId_1 index successfully');
    } catch (err) {
      console.log('Drop index note:', err.message);
    }

    await bookingsColl.createIndex(
      { userId: 1, liveSessionId: 1 },
      {
        unique: true,
        partialFilterExpression: { liveSessionId: { $exists: true, $type: 'objectId' } },
        name: 'userId_1_liveSessionId_1',
      }
    );
    console.log('✓ Recreated userId_1_liveSessionId_1 with partialFilterExpression');

    const indexes = await bookingsColl.indexes();
    const target = indexes.find((i) => i.name === 'userId_1_liveSessionId_1');
    console.log('New index configuration:', JSON.stringify(target, null, 2));
  } catch (e) {
    console.error('Error fixing index:', e);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixIndex();
