import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  LearningPath,
  LearningPathDomainTopic,
} from './src/models/index.js';

dotenv.config();

async function testDynamicDuration() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });

  const agg = await LearningPathDomainTopic.aggregate([
    { $match: { status: 'ACTIVE' } },
    {
      $lookup: {
        from: 'topics',
        localField: 'topicId',
        foreignField: '_id',
        as: 'topicDoc',
      },
    },
    { $unwind: '$topicDoc' },
    {
      $group: {
        _id: '$learningPathId',
        totalMinutes: { $sum: { $ifNull: ['$topicDoc.duration', 0] } },
        totalTopics: { $sum: 1 },
      },
    },
  ]);

  console.log('DYNAMIC DURATION CALCULATION:');
  for (const item of agg) {
    const lp = await LearningPath.findById(item._id).select('title estimatedDuration').lean();
    const hours = (item.totalMinutes / 60).toFixed(1);
    const formatted = item.totalMinutes >= 60 ? `${hours} Hours` : `${item.totalMinutes} Mins`;
    console.log(`- ${lp?.title}: Calculated = ${formatted} (${item.totalMinutes} mins across ${item.totalTopics} topics) | Stored Static = "${lp?.estimatedDuration}"`);
  }

  await mongoose.disconnect();
}

testDynamicDuration().catch(console.error);
