import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  LearningPath,
  LearningPathDomainTopic,
  Topic,
  Lesson,
} from './src/models/index.js';

dotenv.config();

async function checkDurations() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  const lps = await LearningPath.find().lean();
  for (const lp of lps) {
    console.log('--- PATH:', lp.title, '---');
    console.log('  Stored estimatedDuration:', lp.estimatedDuration);

    const domainTopics = await LearningPathDomainTopic.find({ learningPathId: lp._id, status: 'ACTIVE' }).lean();
    const topicIds = domainTopics.map((dt) => dt.topicId);
    const topics = await Topic.find({ _id: { $in: topicIds } }).lean();

    let totalTopicMinutes = 0;
    topics.forEach((t) => {
      totalTopicMinutes += Number(t.duration) || 0;
    });
    console.log('  Total Topic Minutes:', totalTopicMinutes);

    const lessons = await Lesson.find({ topicId: { $in: topicIds } }).lean();
    let totalLessonSeconds = 0;
    lessons.forEach((l) => {
      totalLessonSeconds += Number(l.duration) || 0;
    });
    console.log('  Lessons count:', lessons.length, 'Total Lesson Seconds:', totalLessonSeconds, `(${Math.round(totalLessonSeconds / 60)} mins or ${(totalLessonSeconds / 3600).toFixed(1)} hrs)`);
  }
  await mongoose.disconnect();
}

checkDurations().catch(console.error);
