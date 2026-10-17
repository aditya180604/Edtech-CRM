import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { CoursesService } from './src/modules/courses/courses.service.js';
import { StudentDashboardService } from './src/modules/studentDashboard/studentDashboard.service.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const userId = '6aca3ccd45313d8270b1bfbf';
  const slug = 'complete-ui-ux-design-bootcamp-0256';
  
  console.log('Testing updateProgress...');
  const res1 = await CoursesService.updateProgress({
    slug,
    userId,
    lessonId: '6accf6f80e808d0859ab790a',
    topicId: '6accf6f80e808d0859ab7908',
    completed: true,
  });
  console.log('Res 1:', res1);

  const res2 = await CoursesService.updateProgress({
    slug,
    userId,
    lessonId: '6accf6f90e808d0859ab790e',
    topicId: '6accf6f90e808d0859ab790c',
    completed: true,
  });
  console.log('Res 2:', res2);

  console.log('Checking StudentDashboardService.getOverview...');
  const dash = await StudentDashboardService.getOverview(userId);
  const uiux = dash.learningCourses.activeCourses.find(c => c.slug === slug);
  console.log('UI/UX course on dashboard:', uiux);

  await mongoose.disconnect();
  process.exit(0);
}
run().catch(e => { console.error('Error:', e); process.exit(1); });
