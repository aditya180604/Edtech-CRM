import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, InstructorProfile } from '../models/index.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

export async function migrateInstructorIds() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('[Migration] Connected to MongoDB database.');
  }

  // Find all instructors
  const instructors = await User.find({ role: ROLES.INSTRUCTOR }).sort({ createdAt: 1 });
  console.log(`[Migration] Found ${instructors.length} registered instructor(s) in system.`);

  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  const generateId = () => {
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    return `ins-${part1}-${part2}`;
  };

  let updatedCount = 0;

  for (const instructor of instructors) {
    const isChunkedFormat = /^ins-[a-z0-9]{4}-[a-z0-9]{4}$/.test(instructor.instructorId || '');
    if (!instructor.instructorId || !isChunkedFormat) {
      let assignedId = generateId();
      while (await User.exists({ instructorId: assignedId })) {
        assignedId = generateId();
      }
      instructor.instructorId = assignedId;
      await instructor.save();

      // Update or create corresponding InstructorProfile
      let profile = await InstructorProfile.findOne({ userId: instructor._id });
      if (profile) {
        profile.instructorId = assignedId;
        await profile.save();
      } else {
        await InstructorProfile.create({
          userId: instructor._id,
          instructorId: assignedId,
          bio: '',
          skills: [],
          expertise: [],
          isCompleted: false,
        });
      }

      console.log(`[Migration] Assigned ${assignedId} -> ${instructor.email} (${instructor.firstName || ''} ${instructor.lastName || ''})`);
      updatedCount++;
    } else {
      console.log(`[Migration] Instructor ${instructor.email} already has valid ID: ${instructor.instructorId}`);
      // Ensure profile is synced
      let profile = await InstructorProfile.findOne({ userId: instructor._id });
      if (profile && profile.instructorId !== instructor.instructorId) {
        profile.instructorId = instructor.instructorId;
        await profile.save();
      }
    }
  }

  // Also check orphan instructor profiles without an instructorId
  const profiles = await InstructorProfile.find({ instructorId: { $exists: false } });
  for (const prof of profiles) {
    const u = await User.findById(prof.userId);
    if (u && u.instructorId) {
      prof.instructorId = u.instructorId;
      await prof.save();
    }
  }

  console.log(`[Migration Completed] Successfully assigned unique IDs to ${updatedCount} instructor(s).`);
}

// Direct execution guard
if (process.argv[1]?.endsWith('migrateInstructorIds.js')) {
  migrateInstructorIds()
    .then(() => {
      console.log('[Migration] Done. Exiting process.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}
