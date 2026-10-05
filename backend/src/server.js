import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

// Import all models to ensure schemas are registered with Mongoose
import './models/index.js';
import { startWebinarExpiryCron, stopWebinarExpiryCron } from './modules/webinars/webinarExpiry.cron.js';

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start automated 2-hour webinar expiry cron
    startWebinarExpiryCron();

    // 3. Start Express Listener
    const server = app.listen(config.port, () => {
      console.log(`[Server] Edutech LMS backend running on port ${config.port} [${config.env}]`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/v1/health`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      stopWebinarExpiryCron();
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
