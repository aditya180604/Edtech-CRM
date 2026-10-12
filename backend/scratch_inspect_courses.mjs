import { Course, Topic, LearningPath } from './src/models/index.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  
  const courses = await Course.find({})
    .select('title slug category subcategory level price status skills description')
    .lean();
    
  console.log('=== TOTAL COURSES IN DB:', courses.length, '===');
  
  const categories = {};
  courses.forEach(c => {
    const cat = c.category || 'Uncategorized';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ title: c.title, slug: c.slug, level: c.level, status: c.status, skills: c.skills, description: c.description });
  });
  
  console.log('=== COURSES GROUPED BY CATEGORY / SECTOR ===');
  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n========================================`);
    console.log(`SECTOR / CATEGORY: [${cat}] (${items.length} courses)`);
    console.log(`========================================`);
    items.forEach(it => {
      console.log(`• Course: "${it.title}"`);
      console.log(`  Slug: ${it.slug}`);
      console.log(`  Level: ${it.level} | Status: ${it.status}`);
      console.log(`  Skills: ${(it.skills || []).join(', ')}`);
      console.log(`  Description: ${it.description ? it.description.slice(0, 100) + '...' : 'N/A'}`);
    });
  }
  
  const paths = await LearningPath.find({}).lean();
  console.log('\n========================================');
  console.log('CURRENT LEARNING PATHS (Count: ' + paths.length + ')');
  console.log('========================================');
  paths.forEach(p => {
    console.log(`• Title: "${p.title}" | Career: "${p.career}" | Level: "${p.level}" | Status: "${p.status}"`);
  });
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
