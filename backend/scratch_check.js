import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Entitlement, LearningProgress } from './src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const users = await User.find({
    $or: [{ firstName: /maso/i }, { lastName: /sharma/i }]
  });
  console.log('Users found:', users.map(u => ({ id: u._id, email: u.email, role: u.role, name: u.firstName + ' ' + u.lastName })));
  for (const u of users) {
    const ents = await Entitlement.find({ userId: u._id });
    console.log(`Entitlements for ${u.email} (${u._id}):`, ents.map(e => ({ productType: e.productType, courseId: e.courseId, topicId: e.topicId, productId: e.productId })));
    const progs = await LearningProgress.find({ userId: u._id });
    console.log(`LearningProgress for ${u.email} (${u._id}):`, progs.map(p => ({ courseId: p.courseId, lessonId: p.lessonId, topicId: p.topicId, completed: p.completed })));
  }
  await mongoose.disconnect();
  process.exit(0);
}
run();
