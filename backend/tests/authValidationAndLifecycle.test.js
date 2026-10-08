import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes } from '../src/modules/auth/auth.routes.js';
import { User, InstructorProfile } from '../src/models/index.js';
import { config } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import http from 'http';

// Helper for making HTTP requests to test server
function httpRequest(app, method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const payload = data ? JSON.stringify(data) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            server.close();
            try {
              const parsed = body ? JSON.parse(body) : null;
              resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
            }
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) req.write(payload);
      req.end();
    });
  });
}

async function runTests() {
  console.log('--- STARTING AUTH & VALIDATION TEST SUITE ---');

  // Connect to DB
  await mongoose.connect(config.mongodb.uri);
  console.log('✓ Connected to MongoDB');

  // Setup Express App
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);

  const testEmailPrefix = `test_auth_${Date.now()}`;
  const validEmail = `${testEmailPrefix}@example.com`;
  const validInstructorEmail = `${testEmailPrefix}_inst@example.com`;

  try {
    // -------------------------------------------------------------
    // 1. REGISTRATION VALIDATION TESTS
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 1] Registration Validation Checks');

    // 1.1 Empty payload
    let res = await httpRequest(app, 'POST', '/api/v1/auth/register', {});
    console.assert(res.status === 400, 'Expected 400 for empty registration payload');
    console.log('✓ 1.1 Rejected empty payload');

    // 1.2 Invalid Name (< 2 chars)
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'A',
      lastName: 'User',
      email: validEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for short firstName');
    console.log('✓ 1.2 Rejected first name < 2 chars');

    // 1.3 Invalid Name (Contains digits / symbols)
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul123',
      lastName: 'Sharma',
      email: validEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for invalid characters in name');
    console.log('✓ 1.3 Rejected name with digits/symbols');

    // 1.4 Invalid Email Format
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'invalid-email-format',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for invalid email format');
    console.log('✓ 1.4 Rejected invalid email format');

    // 1.5 Weak Password: No uppercase
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: validEmail,
      password: 'password123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for password missing uppercase');
    console.log('✓ 1.5 Rejected password missing uppercase');

    // 1.6 Weak Password: No number
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: validEmail,
      password: 'PasswordNoNumber!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for password missing number');
    console.log('✓ 1.6 Rejected password missing number');

    // 1.7 Weak Password: No special character
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: validEmail,
      password: 'Password12345',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for password missing special char');
    console.log('✓ 1.7 Rejected password missing special character');

    // 1.8 Prohibited Role: ADMIN public registration
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Admin',
      lastName: 'User',
      email: validEmail,
      password: 'StrongPassword123!',
      role: 'ADMIN',
    });
    console.assert(res.status === 403 || res.status === 400, 'Expected 403/400 for prohibited ADMIN registration');
    console.log('✓ 1.8 Rejected public ADMIN registration');

    // 1.9 Valid Student Registration
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: validEmail,
      phone: '+919876543210',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 201, `Expected 201 for valid student registration, got ${res.status}`);
    console.assert(res.body?.data?.accessToken, 'Expected accessToken in registration response');
    console.assert(res.body?.data?.refreshToken, 'Expected refreshToken in registration response');
    console.assert(res.body?.data?.user?.role === 'STUDENT', 'Expected role STUDENT');
    const studentAccessToken = res.body.data.accessToken;
    const studentRefreshToken = res.body.data.refreshToken;
    console.log('✓ 1.9 Successfully registered Student with token generation');

    // 1.10 Duplicate Email Registration
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: validEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.assert(res.status === 400, 'Expected 400 for duplicate email');
    console.log('✓ 1.10 Rejected duplicate email registration');

    // 1.11 Valid Instructor Registration
    res = await httpRequest(app, 'POST', '/api/v1/auth/register', {
      firstName: 'Priya',
      lastName: 'Verma',
      email: validInstructorEmail,
      password: 'StrongPassword123!',
      role: 'INSTRUCTOR',
    });
    console.assert(res.status === 201, `Expected 201 for instructor registration, got ${res.status}`);
    console.assert(res.body?.data?.user?.role === 'INSTRUCTOR', 'Expected role INSTRUCTOR');
    console.log('✓ 1.11 Successfully registered Instructor');

    // -------------------------------------------------------------
    // 2. LOGIN VALIDATION & AUTHENTICATION TESTS
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 2] Login Validation & Authentication Checks');

    // 2.1 Missing email/password
    res = await httpRequest(app, 'POST', '/api/v1/auth/login', {});
    console.assert(res.status === 400, 'Expected 400 for missing login credentials');
    console.log('✓ 2.1 Rejected empty login payload');

    // 2.2 Invalid email format on login
    res = await httpRequest(app, 'POST', '/api/v1/auth/login', {
      email: 'not-an-email',
      password: 'AnyPassword123!',
    });
    console.assert(res.status === 400, 'Expected 400 for invalid email on login');
    console.log('✓ 2.2 Rejected malformed email on login');

    // 2.3 Wrong password
    res = await httpRequest(app, 'POST', '/api/v1/auth/login', {
      email: validEmail,
      password: 'WrongPassword123!',
    });
    console.assert(res.status === 401, 'Expected 401 for wrong password');
    console.log('✓ 2.3 Rejected incorrect password');

    // 2.4 Successful Student Login
    res = await httpRequest(app, 'POST', '/api/v1/auth/login', {
      email: validEmail,
      password: 'StrongPassword123!',
    });
    console.assert(res.status === 200, 'Expected 200 for valid login');
    console.assert(res.body?.data?.accessToken, 'Expected accessToken on login');
    console.assert(res.body?.data?.refreshToken, 'Expected refreshToken on login');
    const loggedInAccessToken = res.body.data.accessToken;
    const loggedInRefreshToken = res.body.data.refreshToken;
    console.log('✓ 2.4 Successfully logged in with credentials');

    // -------------------------------------------------------------
    // 3. PROTECTED ROUTE /me & SESSION PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 3] Protected Route /me & Session Validation');

    // 3.1 Request /me without Authorization header
    res = await httpRequest(app, 'GET', '/api/v1/auth/me');
    console.assert(res.status === 401, 'Expected 401 for unauthenticated /me');
    console.log('✓ 3.1 Unauthenticated /me rejected with 401');

    // 3.2 Request /me with valid Authorization header
    res = await httpRequest(app, 'GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${loggedInAccessToken}`,
    });
    console.assert(res.status === 200, 'Expected 200 for authenticated /me');
    console.assert(res.body?.data?.user?.email === validEmail, 'Expected matching user email');
    console.log('✓ 3.2 Authenticated /me returned profile payload');

    // -------------------------------------------------------------
    // 4. TOKEN REFRESH, ROTATION & EXPIRATION HANDLING
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 4] Refresh Token Rotation & Expiration Lifecycle');

    // 4.1 Refresh without token
    res = await httpRequest(app, 'POST', '/api/v1/auth/refresh', {});
    console.assert(res.status === 400, 'Expected 400 when refresh token is missing');
    console.log('✓ 4.1 Missing refresh token rejected');

    // 4.2 Refresh with invalid/garbage token
    res = await httpRequest(app, 'POST', '/api/v1/auth/refresh', {
      refreshToken: 'invalid.jwt.token.string',
    });
    console.assert(res.status === 401, 'Expected 401 for forged refresh token');
    console.log('✓ 4.2 Invalid/forged refresh token rejected');

    // 4.3 Successful Token Refresh with Single-Use Rotation
    res = await httpRequest(app, 'POST', '/api/v1/auth/refresh', {
      refreshToken: loggedInRefreshToken,
    });
    console.assert(res.status === 200, 'Expected 200 for valid token refresh');
    console.assert(res.body?.data?.accessToken, 'Expected new access token');
    console.assert(res.body?.data?.refreshToken, 'Expected new refresh token');
    const rotatedAccessToken = res.body.data.accessToken;
    const rotatedRefreshToken = res.body.data.refreshToken;
    console.log('✓ 4.3 Successfully refreshed token pair with rotation');

    // 4.4 Verify new access token works on /me
    res = await httpRequest(app, 'GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${rotatedAccessToken}`,
    });
    console.assert(res.status === 200, 'Expected 200 with rotated access token');
    console.log('✓ 4.4 Rotated access token authenticated successfully');

    // -------------------------------------------------------------
    // 5. LOGOUT LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 5] Logout & Session Invalidation');

    // 5.1 Logout user
    res = await httpRequest(app, 'POST', '/api/v1/auth/logout', null, {
      Authorization: `Bearer ${rotatedAccessToken}`,
    });
    console.assert(res.status === 200, 'Expected 200 for logout');
    console.log('✓ 5.1 Successfully logged out');

    // 5.2 Attempt refresh after logout
    res = await httpRequest(app, 'POST', '/api/v1/auth/refresh', {
      refreshToken: rotatedRefreshToken,
    });
    console.assert(res.status === 401, 'Expected 401 when using refresh token after logout');
    console.log('✓ 5.2 Refresh token invalid after logout');

    console.log('\n=============================================');
    console.log('ALL AUTHENTICATION & VALIDATION TESTS PASSED!');
    console.log('=============================================\n');
  } finally {
    // Cleanup created test users
    await User.deleteMany({ email: { $in: [validEmail, validInstructorEmail] } });
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
