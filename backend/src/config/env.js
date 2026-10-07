import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Single source of truth for environment: backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.DATABASE_NAME || 'edutech_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'edutech_jwt_secure_access_secret_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'edutech_jwt_secure_refresh_secret_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : process.env.CORS_ORIGIN
      : ['http://localhost:5173', 'http://localhost:3000'],
  },
  cashfree: {
    env: (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase(),
    apiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
    appId:
      (process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION'
        ? (process.env.CASHFREE_APP_ID_PRODUCTION || process.env.CASHFREE_APP_ID)
        : (process.env.CASHFREE_APP_ID_SANDBOX || process.env.CASHFREE_APP_ID || 'TEST10754511fde0a856149a27cfd56211545701'),
    secretKey:
      (process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION'
        ? (process.env.CASHFREE_SECRET_KEY_PRODUCTION || process.env.CASHFREE_SECRET_KEY)
        : (process.env.CASHFREE_SECRET_KEY_SANDBOX || process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_test_35e2647e899a341cd2bd8266f123c975_04c396a7'),
    baseUrl:
      (process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
};
