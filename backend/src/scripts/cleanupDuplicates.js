import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;
  
  // 1. Find duplicate lessons
  const lessons = await db.collection('lessons').find({}).toArray();
  const seenLessons = new Map();
  const duplicateLessonIds = [];
  for (const l of lessons) {
    const key = l.topicId ? (l.topicId.toString() + '_' + (l.title || '').trim().toLowerCase()) : null;
    if (key) {
      if (seenLessons.has(key)) {
        duplicateLessonIds.push(l._id);
      } else {
        seenLessons.set(key, l._id);
      }
    }
  }
  console.log('Found duplicate lessons:', duplicateLessonIds.length);
  if (duplicateLessonIds.length > 0) {
    const res = await db.collection('lessons').deleteMany({ _id: { $in: duplicateLessonIds } });
    console.log('Deleted duplicate lessons count:', res.deletedCount);
  }

  // 2. Find duplicate topics under same module
  const topics = await db.collection('topics').find({}).toArray();
  const seenTopics = new Map();
  const duplicateTopicIds = [];
  for (const t of topics) {
    const key = t.moduleId ? (t.moduleId.toString() + '_' + (t.title || '').trim().toLowerCase()) : null;
    if (key) {
      if (seenTopics.has(key)) {
        duplicateTopicIds.push(t._id);
      } else {
        seenTopics.set(key, t._id);
      }
    }
  }
  console.log('Found duplicate topics:', duplicateTopicIds.length);
  if (duplicateTopicIds.length > 0) {
    const res = await db.collection('topics').deleteMany({ _id: { $in: duplicateTopicIds } });
    console.log('Deleted duplicate topics count:', res.deletedCount);
  }

  // 3. Find duplicate modules under same course
  const modules = await db.collection('modules').find({}).toArray();
  const seenModules = new Map();
  const duplicateModuleIds = [];
  for (const m of modules) {
    const key = m.courseId ? (m.courseId.toString() + '_' + (m.title || '').trim().toLowerCase()) : null;
    if (key) {
      if (seenModules.has(key)) {
        duplicateModuleIds.push(m._id);
      } else {
        seenModules.set(key, m._id);
      }
    }
  }
  console.log('Found duplicate modules:', duplicateModuleIds.length);
  if (duplicateModuleIds.length > 0) {
    const res = await db.collection('modules').deleteMany({ _id: { $in: duplicateModuleIds } });
    console.log('Deleted duplicate modules count:', res.deletedCount);
  }

  await mongoose.disconnect();
  console.log('Done cleanup!');
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
