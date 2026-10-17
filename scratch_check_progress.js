import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { Course, Topic, Lesson, LearningProgress, User } from './backend/src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edtech');
  const user = await User.findOne({ email: /maso/i });
  console.log('User found:', user?._id, user?.email, user?.firstName, user?.lastName);
  const c = await Course.findOne({ slug: 'complete-ui-ux-design-bootcamp-0256' });
  console.log('Course found:', c?._id, c?.title);
  if (c) {
    const topics = await Topic.find({ courseId: c._id });
    console.log('Topics count:', topics.length);
    const topicIds = topics.map(t => t._id);
    const lessons = await Lesson.find({ topicId: { $in: topicIds } });
    console.log('Lessons count:', lessons.length);
    const progresses = await LearningProgress.find({ courseId: c._id });
    console.log('LearningProgresses for this course:', JSON.stringify(progresses, null, 2));
  }
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
