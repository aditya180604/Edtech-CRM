import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';

async function fetchAllCollectionsAndFields() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;

    const collections = await db.listCollections().toArray();
    collections.sort((a, b) => a.name.localeCompare(b.name));

    const collectionData = [];

    for (const col of collections) {
      const collectionName = col.name;
      const count = await db.collection(collectionName).countDocuments();

      // Sample documents to get all actual fields present in MongoDB
      const docs = await db.collection(collectionName).find({}).limit(10).toArray();

      const fieldSet = new Set();
      for (const doc of docs) {
        for (const key of Object.keys(doc)) {
          fieldSet.add(key);
        }
      }

      collectionData.push({
        collection: collectionName,
        count,
        fields: Array.from(fieldSet),
      });
    }

    console.log('---START_COLLECTION_DATA---');
    console.log(JSON.stringify(collectionData, null, 2));
    console.log('---END_COLLECTION_DATA---');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Error fetching collections and fields:', error);
    await disconnectDB();
    process.exit(1);
  }
}

fetchAllCollectionsAndFields();
