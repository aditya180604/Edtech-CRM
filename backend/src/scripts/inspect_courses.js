import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Course } from '../models/index.js';

async function checkCourses() {
  await connectDB();
  const allCourses = await Course.find({}).lean();
  console.log(`TOTAL COURSES IN DB: ${allCourses.length}`);
  allCourses.forEach((c, i) => {
    console.log(`Course ${i + 1}:`, {
      _id: c._id,
      title: c.title,
      name: c.name,
      status: c.status,
      category: c.category,
      coursePrice: c.coursePrice,
      price: c.price,
    });
  });
  await mongoose.disconnect();
}

checkCourses();
