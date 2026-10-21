import mongoose from 'mongoose';
import { config } from './env.js';
import { getContext, recordDbCommand } from '../utils/requestContext.js';

let isConnected = false;

const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS || '500', 10);
const IGNORED_COMMANDS = new Set(['hello', 'ismaster', 'isMaster', 'ping', 'saslStart', 'saslContinue', 'endSessions', 'buildInfo']);
const dbStats = { commands: 0, failures: 0, slow: 0, totalMs: 0 };

/**
 * Attribute driver commands to the active request (AsyncLocalStorage) and log slow ones.
 * Logs only command name, collection and duration: never filters, which can contain personal data.
 */
function attachCommandMonitoring(client) {
  const pending = new Map(); // driver requestId -> request context

  client.on('commandStarted', (event) => {
    if (IGNORED_COMMANDS.has(event.commandName)) return;
    if (pending.size > 10000) pending.clear(); // safety valve; entries are removed on completion
    pending.set(event.requestId, getContext() || null);
  });

  const finish = (event, failed) => {
    if (!pending.has(event.requestId)) return;
    const ctx = pending.get(event.requestId);
    pending.delete(event.requestId);
    const ms = event.duration;
    dbStats.commands++;
    dbStats.totalMs += ms;
    if (failed) dbStats.failures++;
    recordDbCommand(ctx, ms);
    if (ms >= SLOW_QUERY_MS || failed) {
      if (ms >= SLOW_QUERY_MS) dbStats.slow++;
      console.warn(
        JSON.stringify({
          level: failed ? 'error' : 'warn',
          type: failed ? 'db_failure' : 'slow_query',
          command: event.commandName,
          collection: typeof event.command?.[event.commandName] === 'string' ? event.command[event.commandName] : undefined,
          ms: Math.round(ms),
          error: failed ? event.failure?.message : undefined,
          requestId: ctx?.requestId,
        })
      );
    }
  };

  client.on('commandSucceeded', (event) => finish(event, false));
  client.on('commandFailed', (event) => finish(event, true));
}

export function getDbStats() {
  const client = isConnected ? mongoose.connection.getClient() : null;
  return {
    connected: mongoose.connection.readyState === 1,
    ...dbStats,
    avgMs: dbStats.commands ? Number((dbStats.totalMs / dbStats.commands).toFixed(1)) : null,
    maxPoolSize: client?.options?.maxPoolSize,
    minPoolSize: client?.options?.minPoolSize,
  };
}

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is not defined in the environment configuration.');
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const conn = await mongoose.connect(config.mongodb.uri, {
        dbName: config.mongodb.dbName,
        serverSelectionTimeoutMS: 15000,
        autoIndex: process.env.NODE_ENV !== 'production',
        // Pool sizing: keep a few warm connections so requests don't pay TLS + auth
        // handshakes (several round trips) after idle periods; cap concurrency per instance.
        maxPoolSize: config.mongodb.maxPoolSize,
        minPoolSize: config.mongodb.minPoolSize,
        maxIdleTimeMS: 5 * 60 * 1000,
        // Backstop so a stuck socket cannot hang a request forever.
        socketTimeoutMS: config.mongodb.socketTimeoutMS,
        monitorCommands: true,
      });

      isConnected = true;
      attachCommandMonitoring(conn.connection.getClient());
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
      console.error(`[Database] MongoDB connection attempt ${attempts}/${maxAttempts} failed:`, error.message);
      if (attempts >= maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log(`[Database] MongoDB disconnected gracefully.`);
}
