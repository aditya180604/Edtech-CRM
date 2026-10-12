import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function check() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DATABASE_NAME || 'edutech_db',
      serverSelectionTimeoutMS: 15000,
    });
    console.log('Connected to DB:', conn.connection.db.databaseName);
    const users = await conn.connection.db.collection('users').find({}, {
      projection: { email: 1, role: 1, status: 1, firebaseUid: 1, passwordHash: 1, firstName: 1, lastName: 1 }
    }).toArray();

    console.log(`\nFound ${users.length} users:`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. [${u.role}] ${u.email} | Status: ${u.status} | HasFirebase: ${Boolean(u.firebaseUid)} | HasPasswordHash: ${Boolean(u.passwordHash)}`);
    });

    const sa = await conn.connection.db.collection('users').findOne({ email: 'toppix851@gmail.com' });
    console.log('\n--- toppix851@gmail.com Full Record ---');
    console.log(sa);

    const a123 = await conn.connection.db.collection('users').findOne({ email: 'admin123@gmail.com' });
    console.log('\n--- admin123@gmail.com Full Record ---');
    console.log(a123);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
