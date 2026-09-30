import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is not defined in the environment configuration.');
  }

  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      dbName: config.mongodb.dbName,
      serverSelectionTimeoutMS: 15000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.db.databaseName}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn(`[Database] MongoDB disconnected.`);
    });

    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB initial connection failed:`, error.message);
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log(`[Database] MongoDB disconnected gracefully.`);
}
