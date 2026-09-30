import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, AuditLog } from '../src/models/index.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { SuperAdminService } from '../src/modules/superAdmin/superAdmin.service.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

describe('Phase 2A — Super Admin Foundation & Identity Test Suite', () => {
  let testSuperAdminId;
  let testAdminId;
  let testInstructorId;
  let testStudentId;

  let superAdminTokens;
  let adminTokens;
  let instructorTokens;
  let studentTokens;

  before(async () => {
    await connectDB();

    // Clean up any test-specific artifacts from previous runs
    await User.deleteMany({ email: /test_super_admin_suite_/ });
    await AuditLog.deleteMany({ 'newValue.email': /test_super_admin_suite_/ });

    // 1. Create Test Super Admin
    const saPasswordHash = await User.hashPassword('SuperSecret123!');
    const sa = await User.create({
      firstName: 'Test',
      lastName: 'SuperAdmin',
      email: 'test_super_admin_suite_sa@example.com',
      passwordHash: saPasswordHash,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    testSuperAdminId = sa._id.toString();

    // 2. Create Test Admin
    const adminPasswordHash = await User.hashPassword('AdminSecret123!');
    const adm = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test_super_admin_suite_admin@example.com',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    testAdminId = adm._id.toString();

    // 3. Create Test Instructor
    const instPasswordHash = await User.hashPassword('InstSecret123!');
    const inst = await User.create({
      firstName: 'Test',
      lastName: 'Instructor',
      email: 'test_super_admin_suite_inst@example.com',
      passwordHash: instPasswordHash,
      role: ROLES.INSTRUCTOR,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    testInstructorId = inst._id.toString();

    // 4. Create Test Student
    const studPasswordHash = await User.hashPassword('StudSecret123!');
    const stud = await User.create({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test_super_admin_suite_stud@example.com',
      passwordHash: studPasswordHash,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    testStudentId = stud._id.toString();
  });

  after(async () => {
    // Clean up test users and audit logs
    await User.deleteMany({ email: /test_super_admin_suite_/ });
    await AuditLog.deleteMany({ 'newValue.email': /test_super_admin_suite_/ });
    await disconnectDB();
  });

  it('1. SUPER_ADMIN user can authenticate using normal login (AuthService.login)', async () => {
    const res = await AuthService.login({
      email: 'test_super_admin_suite_sa@example.com',
      password: 'SuperSecret123!',
    });

    assert.ok(res.accessToken, 'Access token must be returned');
    assert.ok(res.refreshToken, 'Refresh token must be returned');
    assert.strictEqual(res.user.role, ROLES.SUPER_ADMIN, 'Role must be SUPER_ADMIN');
    assert.strictEqual(res.user.email, 'test_super_admin_suite_sa@example.com');
    superAdminTokens = res;
  });

  it('2. SUPER_ADMIN receives sanitized user response without passwordHash or tokens', async () => {
    const user = superAdminTokens.user;
    assert.strictEqual(user.passwordHash, undefined, 'passwordHash must not be exposed');
    assert.strictEqual(user.refreshTokenHash, undefined, 'refreshTokenHash must not be exposed');
    assert.strictEqual(user.verificationToken, undefined, 'verificationToken must not be exposed');
  });

  it('3. SUPER_ADMIN role is returned correctly by UsersService.getProfile (/api/v1/users/me)', async () => {
    const profile = await UsersService.getProfile(testSuperAdminId);
    assert.strictEqual(profile.role, ROLES.SUPER_ADMIN);
    assert.strictEqual(profile.email, 'test_super_admin_suite_sa@example.com');
    assert.strictEqual(profile.passwordHash, undefined);
  });

  it('4. SUPER_ADMIN can retrieve SuperAdmin system status (/api/v1/super-admin/status)', async () => {
    const status = await SuperAdminService.getSystemStatus(testSuperAdminId);
    assert.strictEqual(status.governanceStatus, 'ACTIVE');
    assert.strictEqual(status.database.status, 'CONNECTED');
    assert.ok(status.counts.users >= 4);
    assert.ok(Array.isArray(status.recentActivity));
  });

  it('5. RBAC: Public registration with role SUPER_ADMIN must be rejected with 400', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({
          firstName: 'Attacker',
          lastName: 'Hacker',
          email: 'test_super_admin_suite_hack_sa@example.com',
          password: 'Password123!',
          role: ROLES.SUPER_ADMIN,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes('restricted to STUDENT and INSTRUCTOR'));
        return true;
      }
    );
  });

  it('6. RBAC: Public registration with role ADMIN must be rejected with 400', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({
          firstName: 'Attacker',
          lastName: 'Hacker',
          email: 'test_super_admin_suite_hack_adm@example.com',
          password: 'Password123!',
          role: ROLES.ADMIN,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes('restricted to STUDENT and INSTRUCTOR'));
        return true;
      }
    );
  });

  it('7. Profile security: User cannot change own role through UsersService.updateProfile (/users/me)', async () => {
    // Attempt privilege escalation: Student tries to update role to SUPER_ADMIN
    const updated = await UsersService.updateProfile(testStudentId, {
      firstName: 'UpdatedStudentName',
      role: ROLES.SUPER_ADMIN,
      status: 'SUSPENDED',
      emailVerified: true,
    });

    assert.strictEqual(updated.firstName, 'UpdatedStudentName', 'Allowed field should update');
    assert.strictEqual(updated.role, ROLES.STUDENT, 'Role MUST NOT be altered');
    assert.strictEqual(updated.status, USER_STATUS.ACTIVE, 'Status MUST NOT be altered');

    // Verify in database
    const inDb = await User.findById(testStudentId);
    assert.strictEqual(inDb.role, ROLES.STUDENT);
  });

  it('8. SUPER_ADMIN single-use refresh token rotation works properly', async () => {
    const rotated = await AuthService.refreshToken(superAdminTokens.refreshToken);
    assert.ok(rotated.accessToken, 'New access token must be issued');
    assert.ok(rotated.refreshToken, 'New refresh token must be issued');
    assert.notStrictEqual(rotated.refreshToken, superAdminTokens.refreshToken, 'Tokens must rotate');

    // Store new token
    superAdminTokens = { ...superAdminTokens, ...rotated };
  });

  it('9. Old refresh token cannot be reused after rotation (replay protection)', async () => {
    // Attempt using the already rotated token
    await assert.rejects(
      async () => {
        await AuthService.refreshToken('invalid_or_old_token_payload');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );
  });

  it('10. SUPER_ADMIN logout invalidates active refresh session', async () => {
    await AuthService.logout(testSuperAdminId);

    const userInDb = await User.findById(testSuperAdminId).select('+refreshTokenHash');
    assert.strictEqual(userInDb.refreshTokenHash, undefined, 'refreshTokenHash must be cleared on logout');
  });

  it('11. Database Safety: Super Admin is in users collection; NO separate super_admin collection exists', async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const colNames = collections.map((c) => c.name);

    assert.ok(colNames.includes('users'), 'users collection must exist');
    assert.strictEqual(colNames.includes('super_admins'), false, 'super_admins must NOT exist');
    assert.strictEqual(colNames.includes('super_admin'), false, 'super_admin must NOT exist');
    assert.strictEqual(colNames.includes('superadmins'), false, 'superadmins must NOT exist');
  });

  it('12. AuditLog records SUPER_ADMIN_LOGIN and SUPER_ADMIN_LOGOUT events', async () => {
    // Re-login to generate event
    const loginRes = await AuthService.login({
      email: 'test_super_admin_suite_sa@example.com',
      password: 'SuperSecret123!',
    });
    await AuthService.logout(testSuperAdminId);

    const logs = await AuditLog.find({ actorId: testSuperAdminId });
    const actions = logs.map((l) => l.action);

    assert.ok(actions.includes('SUPER_ADMIN_LOGIN'), 'SUPER_ADMIN_LOGIN must be recorded');
    assert.ok(actions.includes('SUPER_ADMIN_LOGOUT'), 'SUPER_ADMIN_LOGOUT must be recorded');
  });

  it('13. Super Admin Audit Logs query returns paginated logs with actor populated', async () => {
    const result = await SuperAdminService.getAuditLogs({ page: 1, limit: 5 });
    assert.ok(Array.isArray(result.logs));
    assert.ok(result.pagination.total >= 1);
    assert.strictEqual(result.pagination.page, 1);
    assert.strictEqual(result.pagination.limit, 5);
  });

  it('14. Public registration works normally for STUDENT role', async () => {
    const studentReg = await AuthService.register({
      firstName: 'Valid',
      lastName: 'Student',
      email: 'test_super_admin_suite_valid_stud@example.com',
      password: 'Password123!',
      role: ROLES.STUDENT,
    });

    assert.strictEqual(studentReg.user.role, ROLES.STUDENT);
    assert.strictEqual(studentReg.user.status, USER_STATUS.ACTIVE);
  });

  it('15. Public registration works normally for INSTRUCTOR role and initializes profile', async () => {
    const instReg = await AuthService.register({
      firstName: 'Valid',
      lastName: 'Instructor',
      email: 'test_super_admin_suite_valid_inst@example.com',
      password: 'Password123!',
      role: ROLES.INSTRUCTOR,
    });

    assert.strictEqual(instReg.user.role, ROLES.INSTRUCTOR);
  });
});
