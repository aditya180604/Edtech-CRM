import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { CoursesService } from './src/modules/courses/courses.service.js';
import { User, Course, Topic, Lesson, LearningProgress } from './src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const user = await User.findOne({ email: 'manso76688433@gmail.com' });
  console.log('User:', user._id);
  const course = await Course.findOne({ slug: 'complete-ui-ux-design-bootcamp-0256' });
  console.log('Course:', course._id);
  const topics = await Topic.find({ courseId: course._id });
  const topic1 = topics.find(t => t.title.includes('Design Thinking'));
  console.log('Topic1:', topic1?._id, topic1?.title);
  const lesson1 = await Lesson.findOne({ topicId: topic1._id });
  console.log('Lesson1:', lesson1?._id, lesson1?.title);

  try {
    const res = await CoursesService.updateProgress({
      slug: 'complete-ui-ux-design-bootcamp-0256',
      userId: user._id.toString(),
      lessonId: lesson1._id.toString(),
      topicId: topic1._id.toString(),
      completed: true,
    });
    console.log('updateProgress SUCCESS:', res);
  } catch (e) {
    console.error('updateProgress FAILED:', e);
  }

  const p = await LearningProgress.find({ userId: user._id, courseId: course._id });
  console.log('LearningProgress in DB now:', p);

  await mongoose.disconnect();
  process.exit(0);
}
run();
