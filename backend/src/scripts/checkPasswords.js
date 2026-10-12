import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const testPasswords = ['Password@123', 'password123', 'abc@123', 'admin@123', 'Admin@123', '12345678', '123456'];

async function testPw() {
  const conn = await mongoose.connect(process.env.MONGODB_URI, { dbName: 'edutech_db' });
  const users = await conn.connection.db.collection('users').find({
    passwordHash: { $exists: true, $ne: null }
  }).toArray();

  console.log(`Checking ${users.length} users with passwordHash:`);
  for (const u of users) {
    let matched = null;
    for (const p of testPasswords) {
      if (await bcrypt.compare(p, u.passwordHash)) {
        matched = p;
        break;
      }
    }
    console.log(`- [${u.role}] ${u.email}: password matches '${matched || 'UNKNOWN'}'`);
  }
  await mongoose.disconnect();
}

testPw();
