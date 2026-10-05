import { Webinar } from '../../models/index.js';

/**
 * Checks and automatically marks expired webinars as COMPLETED.
 * A webinar is expired if:
 * 1. Current time is past its endTime, OR
 * 2. Current time is >= 2 hours after its scheduled startTime, OR
 * 3. It was created >= 2 hours ago and is already past its startTime/ongoing.
 */
export async function runWebinarExpiryCheck() {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const result = await Webinar.updateMany(
      {
        status: { $in: ['SCHEDULED', 'LIVE'] },
        $or: [
          // 1. End time has passed
          { endTime: { $lte: now } },
          // 2. Started 2 or more hours ago
          { startTime: { $lte: twoHoursAgo } },
          // 3. Created 2 or more hours ago and start time has arrived
          {
            $and: [
              { createdAt: { $lte: twoHoursAgo } },
              { startTime: { $lte: now } },
            ],
          },
        ],
      },
      {
        $set: { status: 'COMPLETED' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Webinar Cron] Expired and closed ${result.modifiedCount} webinar(s) past 2-hour window.`);
    }
    return result;
  } catch (error) {
    console.error('[Webinar Cron] Error running expiry check:', error);
  }
}

/**
 * Starts background interval cron checking every 30 seconds
 */
let cronIntervalId = null;

export function startWebinarExpiryCron() {
  if (cronIntervalId) return;
  // Run immediately on boot
  runWebinarExpiryCheck();
  // Run every 30 seconds
  cronIntervalId = setInterval(runWebinarExpiryCheck, 30 * 1000);
  console.log('[Webinar Cron] Automated 2-hour webinar expiry cron registered (30s heartbeat).');
}

export function stopWebinarExpiryCron() {
  if (cronIntervalId) {
    clearInterval(cronIntervalId);
    cronIntervalId = null;
  }
}
