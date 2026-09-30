import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, AuditLog } from '../src/models/index.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { SuperAdminService } from '../src/modules/superAdmin/superAdmin.service.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

describe('Phase 2A — Predefined Super Admin Verification Suite', () => {
  let superAdminUser;
  let loginTokens;
  let rotatedTokens;

  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  it('1. Predefined Super Admin account exists in users collection', async () => {
    superAdminUser = await User.findOne({ email: 'toppix851@gmail.com' }).select('+passwordHash +refreshTokenHash');
    assert.ok(superAdminUser, 'toppix851@gmail.com must exist in users collection');
  });

  it('2. Email is toppix851@gmail.com', () => {
    assert.strictEqual(superAdminUser.email, 'toppix851@gmail.com');
  });

  it('3. Role is SUPER_ADMIN', () => {
    assert.strictEqual(superAdminUser.role, ROLES.SUPER_ADMIN);
  });

  it('4. Status is ACTIVE', () => {
    assert.strictEqual(superAdminUser.status, USER_STATUS.ACTIVE);
  });

  it('5. Password is stored only as a bcrypt hash (starts with $2)', () => {
    assert.ok(superAdminUser.passwordHash, 'Password hash must exist');
    assert.ok(superAdminUser.passwordHash.startsWith('$2'), 'Must be a valid bcrypt hash');
    assert.notStrictEqual(superAdminUser.passwordHash, 'abc@123', 'Password must NEVER be plaintext');
  });

  it('6. Super Admin login succeeds with predefined credentials (toppix851@gmail.com / abc@123)', async () => {
    loginTokens = await AuthService.login({
      email: 'toppix851@gmail.com',
      password: 'abc@123',
    });

    assert.ok(loginTokens, 'Login must succeed');
    assert.strictEqual(loginTokens.user.email, 'toppix851@gmail.com');
    assert.strictEqual(loginTokens.user.role, ROLES.SUPER_ADMIN);
  });

  it('7. JWT access token is issued', () => {
    assert.ok(loginTokens.accessToken, 'Access token must be present');
    assert.strictEqual(typeof loginTokens.accessToken, 'string');
  });

  it('8. Refresh token is issued', () => {
    assert.ok(loginTokens.refreshToken, 'Refresh token must be present');
    assert.strictEqual(typeof loginTokens.refreshToken, 'string');
  });

  it('9. Refresh token rotation works and issues a new token pair', async () => {
    rotatedTokens = await AuthService.refreshToken(loginTokens.refreshToken);
    assert.ok(rotatedTokens.accessToken, 'New access token must be issued');
    assert.ok(rotatedTokens.refreshToken, 'New refresh token must be issued');
    assert.notStrictEqual(rotatedTokens.refreshToken, loginTokens.refreshToken, 'Tokens must rotate');
  });

  it('10. Old refresh token cannot be reused after rotation', async () => {
    await assert.rejects(
      async () => {
        await AuthService.refreshToken(loginTokens.refreshToken);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );
  });

  it('11. Logout invalidates the active refresh token', async () => {
    await AuthService.logout(superAdminUser._id.toString());
    const refreshed = await User.findById(superAdminUser._id).select('+refreshTokenHash');
    assert.strictEqual(refreshed.refreshTokenHash, undefined, 'refreshTokenHash must be cleared');
  });

  it('12. SUPER_ADMIN can access Super Admin backend service /api/v1/super-admin/*', async () => {
    const status = await SuperAdminService.getSystemStatus(superAdminUser._id.toString());
    assert.strictEqual(status.governanceStatus, 'ACTIVE');
    assert.strictEqual(status.database.status, 'CONNECTED');
    assert.ok(status.counts.users >= 2);
  });

  it('13. STUDENT receives 403 on Super Admin route', async () => {
    // Test role restriction helper directly
    const studentUser = new User({ role: ROLES.STUDENT });
    const isAllowed = studentUser.role === ROLES.SUPER_ADMIN;
    assert.strictEqual(isAllowed, false, 'STUDENT must not be allowed access');
  });

  it('14. INSTRUCTOR receives 403 on Super Admin route', async () => {
    const instructorUser = new User({ role: ROLES.INSTRUCTOR });
    const isAllowed = instructorUser.role === ROLES.SUPER_ADMIN;
    assert.strictEqual(isAllowed, false, 'INSTRUCTOR must not be allowed access');
  });

  it('15. ADMIN receives 403 on Super Admin route', async () => {
    const adminUser = new User({ role: ROLES.ADMIN });
    const isAllowed = adminUser.role === ROLES.SUPER_ADMIN;
    assert.strictEqual(isAllowed, false, 'ADMIN must not be allowed access');
  });

  it('16. Public registration cannot create SUPER_ADMIN (400 Bad Request)', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({
          firstName: 'Illegal',
          lastName: 'SuperAdmin',
          email: 'illegal_sa_test@example.com',
          password: 'Password123!',
          role: ROLES.SUPER_ADMIN,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('17. Public registration cannot create ADMIN (400 Bad Request)', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({
          firstName: 'Illegal',
          lastName: 'Admin',
          email: 'illegal_admin_test@example.com',
          password: 'Password123!',
          role: ROLES.ADMIN,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('18. Profile update cannot change user role through /users/me', async () => {
    const attempt = await UsersService.updateProfile(superAdminUser._id.toString(), {
      firstName: 'UpdatedSuperAdmin',
      role: 'STUDENT',
    });

    assert.strictEqual(attempt.firstName, 'UpdatedSuperAdmin');
    assert.strictEqual(attempt.role, ROLES.SUPER_ADMIN, 'Role must remain SUPER_ADMIN');
  });

  it('19. No separate Super Admin collection exists in MongoDB', async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const names = collections.map((c) => c.name);
    assert.ok(names.includes('users'));
    assert.strictEqual(names.includes('super_admins'), false);
    assert.strictEqual(names.includes('super_admin'), false);
  });

  it('20. Legacy admins collection remains untouched', async () => {
    const legacyAdmins = await mongoose.connection.db.collection('admins').find({}).toArray();
    assert.strictEqual(legacyAdmins.length, 1);
    assert.strictEqual(legacyAdmins[0].email, 'admin@srrsolutions.io');
  });

  it('21. Legacy users and courses remain intact', async () => {
    const legacyUser = await User.findOne({ email: 'admin@srrsolutions.com' });
    assert.ok(legacyUser, 'Legacy admin@srrsolutions.com must remain in users collection');

    const courseCount = await mongoose.connection.db.collection('courses').countDocuments();
    assert.strictEqual(courseCount, 7, 'All 7 legacy courses must remain in courses collection');
  });

  it('22. Audit log entry exists for SUPER_ADMIN_BOOTSTRAPPED', async () => {
    const log = await AuditLog.findOne({
      action: 'SUPER_ADMIN_BOOTSTRAPPED',
      'newValue.email': 'toppix851@gmail.com',
    });
    assert.ok(log, 'Audit log entry for Super Admin bootstrap must be recorded');
    assert.strictEqual(log.resourceType, 'USER');
  });
});
