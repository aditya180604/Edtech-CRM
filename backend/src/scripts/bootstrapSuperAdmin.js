import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/index.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { AuditLogger } from '../utils/auditLogger.js';

// Parse command-line flags (e.g. --email=admin@example.com --password=...)
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value;
    }
  });
  return args;
}

async function bootstrapSuperAdmin() {
  console.log('====================================================');
  console.log('       SUPER ADMIN BOOTSTRAP INITIALIZATION         ');
  console.log('====================================================\n');

  try {
    await connectDB();

    // 1. Check if a SUPER_ADMIN already exists in the users collection
    const existingSuperAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
    if (existingSuperAdmin) {
      console.log(`[Bootstrap] NOTICE: A SUPER_ADMIN account already exists.`);
      console.log(`[Bootstrap] Existing Email: ${existingSuperAdmin.email}`);
      console.log(`[Bootstrap] Account Status: ${existingSuperAdmin.status}`);
      console.log(`[Bootstrap] Aborting bootstrap safely without modifications.\n`);
      await disconnectDB();
      process.exit(0);
    }

    // 2. Read credentials from CLI arguments or environment variables
    const cliArgs = parseArgs();
    const email = cliArgs.email || process.env.SUPER_ADMIN_EMAIL;
    const password = cliArgs.password || process.env.SUPER_ADMIN_PASSWORD;
    const firstName = cliArgs.firstName || process.env.SUPER_ADMIN_FIRSTNAME || 'Super';
    const lastName = cliArgs.lastName || process.env.SUPER_ADMIN_LASTNAME || 'Admin';

    if (!email || !password) {
      console.error('[Bootstrap] ERROR: Missing required Super Admin credentials.');
      console.error('\nUsage:');
      console.error('  npm run bootstrap:super-admin -- --email=admin@example.com --password=YourStrongPassword123!');
      console.error('  OR set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables.\n');
      await disconnectDB();
      process.exit(1);
    }

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      console.error(`[Bootstrap] ERROR: Invalid email format: '${normalizedEmail}'`);
      await disconnectDB();
      process.exit(1);
    }

    // 4. Validate password length
    if (password.length < 6) {
      console.error('[Bootstrap] ERROR: Password must be at least 6 characters long.');
      await disconnectDB();
      process.exit(1);
    }

    // 5. Check if the email is already in use under a different role
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      console.error(`[Bootstrap] ERROR: An account with email '${normalizedEmail}' already exists with role '${existingEmail.role}'.`);
      await disconnectDB();
      process.exit(1);
    }

    // 6. Securely hash password with bcrypt
    const passwordHash = await User.hashPassword(password);

    // 7. Create Super Admin User document in the single users collection
    const superAdmin = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // 8. Log the bootstrap action in the AuditLog collection
    await AuditLogger.log({
      actorId: superAdmin._id,
      action: 'SUPER_ADMIN_BOOTSTRAPPED',
      resourceType: 'USER',
      resourceId: superAdmin._id.toString(),
      newValue: {
        email: superAdmin.email,
        role: superAdmin.role,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
      },
    });

    console.log('[Bootstrap] SUCCESS: Super Admin account created successfully.');
    console.log(`[Bootstrap] Email: ${superAdmin.email}`);
    console.log(`[Bootstrap] Role: ${superAdmin.role}`);
    console.log(`[Bootstrap] Status: ${superAdmin.status}`);
    console.log('[Bootstrap] Verification: emailVerified = true');
    console.log('[Bootstrap] Audit log entry recorded in audit_logs collection.\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Bootstrap] ERROR: Super Admin bootstrap failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

bootstrapSuperAdmin();
