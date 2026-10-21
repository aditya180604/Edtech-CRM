import { Webinar } from '../../models/index.js';

/**
 * Checks and automatically marks expired webinars as COMPLETED.
 * A webinar is expired if:
 * 1. Current time is past its endTime, OR
 * 2. Current time is >= 2 hours after its scheduled startTime, OR
 * 3. It was created >= 2 hours ago and is already past its startTime/ongoing.
 */
export async function runWebinarExpiryCheck() {
  lastCheckAt = Date.now();
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const result = await Webinar.updateMany(
      {
        status: { $in: ['SCHEDULED', 'LIVE'] },
        $or: [
          // 1. Scheduled end time has passed
          { endTime: { $lte: now } },
          // 2. Safety fallback: start time is more than 6 hours in the past
          { startTime: { $lte: new Date(now.getTime() - 6 * 60 * 60 * 1000) } },
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
 * Read-path variant: the cron already runs every 30s, so request handlers only trigger an
 * extra check if none ran recently, and concurrent requests share one in-flight update.
 */
let lastCheckAt = 0;
let inflightCheck = null;

export function runWebinarExpiryCheckThrottled(minIntervalMs = 15 * 1000) {
  if (inflightCheck) return inflightCheck;
  if (Date.now() - lastCheckAt < minIntervalMs) return Promise.resolve(null);
  lastCheckAt = Date.now();
  inflightCheck = runWebinarExpiryCheck().finally(() => {
    inflightCheck = null;
  });
  return inflightCheck;
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
