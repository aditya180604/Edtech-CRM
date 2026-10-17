import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { StudentDashboardService } from './src/modules/studentDashboard/studentDashboard.service.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const userId = '6aca3ccd45313d8270b1bfbf';
  const overview = await StudentDashboardService.getOverview(userId);
  console.log('activeCourses on dashboard:');
  for (const c of overview.activeCourses) {
    console.log(`- ${c.title} (slug: ${c.slug}): progress=${c.entitledProgressPercentage}%, enrolledTopics=${c.enrolledTopicsCount}/${c.totalCourseTopicsCount}`);
  }
  await mongoose.disconnect();
  process.exit(0);
}
run();
