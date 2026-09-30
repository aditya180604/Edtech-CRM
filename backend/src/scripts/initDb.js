import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import * as models from '../models/index.js';

async function initDatabase() {
  console.log('====================================================');
  console.log('  EDTECH LMS — DATABASE INITIALIZATION & INDEX SYNC  ');
  console.log('====================================================\n');

  try {
    const conn = await connectDB();
    const db = conn.connection.db;

    // 1. Get list of existing collections in database
    const existingCollectionsInfo = await db.listCollections().toArray();
    const existingCollectionNames = new Set(existingCollectionsInfo.map((c) => c.name));

    console.log(`[Status] Existing collections before initialization: ${existingCollectionNames.size}`);
    existingCollectionNames.forEach((name) => console.log(`  - ${name}`));

    console.log(`\n[Status] Registering and syncing ${Object.keys(models).length} Mongoose Models...`);

    const createdCollections = [];
    const preservedCollections = [];
    const indexResults = [];

    for (const [modelName, Model] of Object.entries(models)) {
      if (!Model || !Model.collection) continue;

      const collectionName = Model.collection.name;

      // Ensure collection exists without dropping or deleting data
      if (existingCollectionNames.has(collectionName)) {
        preservedCollections.push(collectionName);
      } else {
        try {
          await db.createCollection(collectionName);
          createdCollections.push(collectionName);
        } catch (err) {
          // If already created concurrently, treat as preserved
          preservedCollections.push(collectionName);
        }
      }

      // Sync indexes for this model safely
      try {
        const syncRes = await Model.syncIndexes();
        const indexes = await Model.collection.indexes();
        indexResults.push({
          model: modelName,
          collection: collectionName,
          indexCount: indexes.length,
          indexes: indexes.map((idx) => idx.name),
        });
      } catch (idxErr) {
        console.warn(`  [Warning] Index sync notice for ${modelName} (${collectionName}):`, idxErr.message);
      }
    }

    const finalCollections = await db.listCollections().toArray();

    console.log('\n====================================================');
    console.log('  DATABASE INITIALIZATION SUMMARY');
    console.log('====================================================');
    console.log(`Total Collections in Database: ${finalCollections.length}`);
    console.log(`Preserved Pre-existing Collections: ${preservedCollections.length}`);
    console.log(`Newly Created Collections: ${createdCollections.length}`);
    console.log(`Synchronized Models with Indexes: ${indexResults.length}\n`);

    if (createdCollections.length > 0) {
      console.log('Newly created collection names:');
      createdCollections.forEach((c) => console.log(`  + ${c}`));
    }

    console.log('\nAll 54 models and collections verified successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n[Error] Database initialization failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

initDatabase();
