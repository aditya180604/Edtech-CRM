import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Course } from '../models/index.js';

async function checkSecondCourse() {
  await connectDB();
  const db = mongoose.connection.db;
  const rawCourses = await db.collection('courses').find({}).toArray();
  console.log(`RAW MONGODB DRIVER COUNT IN edutech_db.courses: ${rawCourses.length}`);
  rawCourses.forEach((c, idx) => {
    console.log(`Course ${idx + 1}:`, {
      _id: c._id,
      title: c.title,
      status: c.status,
      visibility: c.visibility,
      category: c.category,
    });
  });
  await mongoose.disconnect();
}

checkSecondCourse();
