import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function fixLessons() {
  const dbName = process.env.DATABASE_NAME || 'edutech_db';
  await mongoose.connect(process.env.MONGODB_URI, { dbName });
  console.log(`Connected to MongoDB database: ${dbName}`);
  const db = mongoose.connection.db;

  const courses = await db.collection('courses').find({}).toArray();
  console.log(`Found ${courses.length} courses`);

  const topics = await db.collection('topics').find({}).toArray();
  console.log(`Found ${topics.length} topics`);

  const lessons = await db.collection('lessons').find({}).toArray();
  console.log(`Found ${lessons.length} lessons before cleanup`);

  // Delete generated alternate template lessons that have titles like "1. Introduction & Environment Setup for...", "2. Core Architecture...", etc.
  const templateTitles = [
    '2. Core Architecture & Hands-on Implementation',
    '3. Production Considerations & Error Handling',
    '4. Capstone Project Walkthrough'
  ];

  const deleteQuery = {
    $or: [
      { title: { $in: templateTitles } },
      { title: { $regex: /^1\.\s*Introduction\s*&\s*Environment\s*Setup/i } },
      { contentOfferingId: { $ne: null } }
    ]
  };

  const deleteResult = await db.collection('lessons').deleteMany(deleteQuery);
  console.log(`Deleted ${deleteResult.deletedCount} generated alternate placeholder lessons`);

  // Ensure every topic has its own clean lesson matching the topic title
  let createdCount = 0;
  for (const topic of topics) {
    const existingLessons = await db.collection('lessons').find({ topicId: topic._id }).toArray();
    if (existingLessons.length === 0) {
      await db.collection('lessons').insertOne({
        topicId: topic._id,
        courseId: topic.courseId,
        title: topic.title,
        duration: topic.duration || 20,
        playbackReference: topic.videoUrl || '',
        order: 1,
        status: 'PUBLISHED',
        isFreePreview: !!topic.isFree,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      createdCount++;
    }
  }
  console.log(`Ensured topic lessons. Created ${createdCount} clean topic lessons matching topic titles.`);

  const remainingLessons = await db.collection('lessons').find({}).toArray();
  console.log(`Total clean lessons remaining in DB: ${remainingLessons.length}`);

  await mongoose.disconnect();
  console.log('Finished cleanup successfully!');
}

fixLessons().catch(err => {
  console.error('Error fixing lessons:', err);
  process.exit(1);
});
