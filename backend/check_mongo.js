require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa-platform');
  const db = require('./db');
  
  const t = await mongoose.models.Template.findOne({ name: 'auth_login_verification' });
  console.log(JSON.stringify(t, null, 2));
  process.exit(0);
}
run();
