import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import * as models from '../models/index.js';

async function performAudit() {
  const conn = await connectDB();
  const db = conn.connection.db;

  const collections = await db.listCollections().toArray();
  const collectionStats = [];

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    const indexes = await db.collection(col.name).indexes();
    collectionStats.push({
      name: col.name,
      count,
      indexes: indexes.map(i => ({ name: i.name, key: i.key, unique: !!i.unique })),
    });
  }

  // Model schema inspection
  const modelSchemas = {};
  for (const [name, Model] of Object.entries(models)) {
    if (Model && Model.schema) {
      const paths = Object.keys(Model.schema.paths);
      modelSchemas[name] = {
        collection: Model.collection.name,
        fields: paths,
      };
    }
  }

  console.log('AUDIT_DATA_START');
  console.log(JSON.stringify({ collectionStats, modelSchemas }, null, 2));
  console.log('AUDIT_DATA_END');

  await disconnectDB();
  process.exit(0);
}

performAudit();
