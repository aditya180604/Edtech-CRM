import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME || 'edutech_db';
  console.log('Connecting to MongoDB...', dbName);
  await mongoose.connect(uri, { dbName });
  const webinarsCollection = mongoose.connection.collection('webinars');

  // 1. Fix Kubernetes for Beginners status to SCHEDULED
  const k8sUpdate = await webinarsCollection.updateOne(
    { title: 'Kubernetes for Beginners' },
    { $set: { status: 'SCHEDULED' } }
  );
  console.log('K8s update result (modified):', k8sUpdate.modifiedCount);

  // 2. Remove duplicate Docker webinar with 0 registrations
  const dockerDelete = await webinarsCollection.deleteOne({
    _id: new mongoose.Types.ObjectId('6abdc3b16c19069686fbc1ad')
  });
  console.log('Duplicate Docker delete result (deleted):', dockerDelete.deletedCount);

  // 3. Print remaining webinars
  const remaining = await webinarsCollection.find({}).toArray();
  console.log('Remaining webinars count:', remaining.length);
  remaining.forEach((w) => {
    console.log(`- ${w.title} (${w._id}): startTime=${w.startTime} | status=${w.status} | reg=${w.registrations?.length || 0}`);
  });

  await mongoose.disconnect();
  console.log('Done!');
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
