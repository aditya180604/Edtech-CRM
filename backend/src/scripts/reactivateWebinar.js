import { connectDB } from '../config/db.js';
import { Webinar } from '../models/index.js';
import { WebinarsService } from '../modules/webinars/webinars.service.js';

async function main() {
  await connectDB();
  const now = new Date();
  const futureStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000); // 3 hours from now

  const res = await Webinar.updateOne(
    { _id: '6ad21b7af6ee0fbdd2ead471' },
    {
      $set: {
        status: 'SCHEDULED',
        startTime: futureStart,
        endTime: futureEnd,
        actualEndedAt: null,
      },
    }
  );
  console.log('Update result:', res);

  const upcoming = await WebinarsService.getUpcomingWebinars();
  console.log('getUpcomingWebinars output:', JSON.stringify(upcoming, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
