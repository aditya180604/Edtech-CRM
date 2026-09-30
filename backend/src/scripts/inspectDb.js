import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the single .env file located at backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'edutech_db';

async function inspectExistingDatabase() {
  console.log('=== SAFE DATABASE INSPECTION ===');
  console.log(`Configured Database: ${DATABASE_NAME}`);
  console.log(`Connecting to MongoDB URI...`);

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB Connected successfully to host: ${conn.connection.host}`);
    console.log(`Active Database: ${conn.connection.db.databaseName}`);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\nFound ${collections.length} existing collections:`);
    collections.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.name} (type: ${col.type})`);
    });

    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      console.log(`     - ${col.name}: ${count} document(s)`);
      if (count > 0) {
        const sample = await conn.connection.db.collection(col.name).findOne();
        console.log(`       Sample fields in ${col.name}:`, Object.keys(sample || {}));
      }
    }

    await mongoose.disconnect();
    console.log('\nDatabase inspection completed safely and disconnected.');
  } catch (error) {
    console.error('Database connection / inspection failed:', error);
    process.exit(1);
  }
}

inspectExistingDatabase();
