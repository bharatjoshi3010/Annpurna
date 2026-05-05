import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const students = await db.collection('students').find({}).toArray();
    console.log("Student ID Cards:", students.map(u => u.studentIdCard).filter(Boolean));
    console.log("Student Profile Photos:", students.map(u => u.profilePhoto).filter(Boolean));
    
    const restaurants = await db.collection('restaurants').find({ profilePhoto: { $exists: true, $ne: null } }).toArray();
    console.log("Restaurants:", restaurants.map(u => u.profilePhoto));

    process.exit(0);
});
