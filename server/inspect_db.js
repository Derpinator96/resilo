import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function inspectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const centredata = await db.collection('centredatas').findOne();
    const telemetry = await db.collection('telemetries').findOne();
    
    console.log('--- centredata ---');
    console.log(JSON.stringify(centredata, null, 2));
    console.log('--- telemetry ---');
    console.log(JSON.stringify(telemetry, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDb();
