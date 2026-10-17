import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { Course, Topic, Lesson } from './src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const c = await Course.findOne({ slug: 'complete-ui-ux-design-bootcamp-0256' });
  const topics = await Topic.find({ courseId: c._id });
  console.log('Topics:');
  for (const t of topics) {
    console.log(`- Topic: id=${t._id}, title="${t.title}"`);
    const lessons = await Lesson.find({ topicId: t._id });
    for (const l of lessons) {
      console.log(`    Lesson: id=${l._id}, title="${l.title}"`);
    }
  }
  await mongoose.disconnect();
  process.exit(0);
}
run();
