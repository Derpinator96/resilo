import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function inspectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    
    for (const dbInfo of dbs.databases) {
      console.log('Database:', dbInfo.name);
      const db = mongoose.connection.client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      collections.forEach(c => console.log('  -', c.name));
      
      if (collections.some(c => c.name === 'centredatas' || c.name === 'telemetries')) {
        console.log(`\nFound target collections in DB: ${dbInfo.name}`);
        const centredata = await db.collection('centredatas').findOne();
        const telemetry = await db.collection('telemetries').findOne();
        console.log('--- centredata ---');
        console.log(JSON.stringify(centredata, null, 2));
        console.log('--- telemetry ---');
        console.log(JSON.stringify(telemetry, null, 2));
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDb();
