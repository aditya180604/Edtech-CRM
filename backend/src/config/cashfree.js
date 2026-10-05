import { config } from './env.js';

const isProduction = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION';

export const cashfreeConfig = {
  env: isProduction ? 'PRODUCTION' : 'SANDBOX',
  isProduction,
  apiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
  baseUrl: isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
  appId: isProduction
    ? process.env.CASHFREE_APP_ID_PRODUCTION || process.env.CASHFREE_APP_ID
    : process.env.CASHFREE_APP_ID_SANDBOX || process.env.CASHFREE_APP_ID,
  secretKey: isProduction
    ? process.env.CASHFREE_SECRET_KEY_PRODUCTION || process.env.CASHFREE_SECRET_KEY
    : process.env.CASHFREE_SECRET_KEY_SANDBOX || process.env.CASHFREE_SECRET_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000',
};

export function validateCashfreeConfig() {
  if (!cashfreeConfig.appId) {
    throw new Error(`[Cashfree Config] Missing Cashfree App/Client ID for ${cashfreeConfig.env} environment.`);
  }
  if (!cashfreeConfig.secretKey) {
    throw new Error(`[Cashfree Config] Missing Cashfree Secret Key for ${cashfreeConfig.env} environment.`);
  }
  return true;
}
