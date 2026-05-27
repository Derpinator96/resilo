import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function inspectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(c => console.log(c.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDb();
