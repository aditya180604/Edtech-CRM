import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

async function checkLearningPaths() {
  await connectDB();
  const db = mongoose.connection.db;
  const paths = await db.collection('learning_paths').find({}).toArray();
  console.log(`TOTAL LEARNING PATHS: ${paths.length}`);
  paths.forEach((p, i) => {
    console.log(`Path ${i + 1}:`, {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      career: p.career,
      courses: p.courses,
    });
  });
  await mongoose.disconnect();
}

checkLearningPaths();
