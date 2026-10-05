import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

const app = express();

// Dynamic CORS Origin Validator
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests (Postman, curl, webhooks)

  // 1. Explicitly configured origins in environment
  const configuredOrigins = config.cors.origin;
  if (Array.isArray(configuredOrigins) && configuredOrigins.includes(origin)) return true;
  if (typeof configuredOrigins === 'string' && (configuredOrigins === origin || configuredOrigins === '*')) return true;

  // 2. Allow all local dev servers (localhost and 127.0.0.1 on any port)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  // 3. Allow standard hosting platforms
  if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/.*\.pages\.dev$/.test(origin)) return true;
  if (/^https:\/\/.*\.github\.io$/.test(origin)) return true;

  return false;
};

// Security and utility middleware
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'idempotency-key',
      'Idempotency-Key',
      'x-idempotency-key',
      'x-webhook-signature',
      'x-webhook-timestamp',
      'x-client-id',
      'x-api-version',
      'Cache-Control',
      'Pragma',
    ],
  })
);
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf ? buf.toString('utf8') : '';
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Support both /api/v1 and direct /api/payments for webhooks
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Root health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Edutech LMS & CRM Backend' });
});

// Centralized error handling
app.use(errorHandler);

export default app;
