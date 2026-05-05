import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    let count = 0;

    // Fix students
    const students = await db.collection('students').find({ profilePhoto: { $exists: true, $ne: null } }).toArray();
    for (const student of students) {
        if (student.profilePhoto.startsWith('http')) {
            const match = student.profilePhoto.match(/:\/\/[^/]+(\/.*)/);
            if (match && match[1]) {
                await db.collection('students').updateOne({ _id: student._id }, { $set: { profilePhoto: match[1] } });
                count++;
            }
        }
    }

    // Fix restaurants
    const restaurants = await db.collection('restaurants').find({ profilePhoto: { $exists: true, $ne: null } }).toArray();
    for (const rest of restaurants) {
        if (rest.profilePhoto.startsWith('http')) {
            const match = rest.profilePhoto.match(/:\/\/[^/]+(\/.*)/);
            if (match && match[1]) {
                await db.collection('restaurants').updateOne({ _id: rest._id }, { $set: { profilePhoto: match[1] } });
                count++;
            }
        }
    }

    // Fix menu items
    const menus = await db.collection('menus').find({ "items.image": { $exists: true } }).toArray();
    for (const menu of menus) {
        let modified = false;
        for (const item of menu.items) {
            if (item.image && item.image.startsWith('http')) {
                const match = item.image.match(/:\/\/[^/]+(\/.*)/);
                if (match && match[1]) {
                    item.image = match[1];
                    modified = true;
                }
            }
        }
        if (modified) {
            await db.collection('menus').updateOne({ _id: menu._id }, { $set: { items: menu.items } });
            count++;
        }
    }

    console.log(`Fixed ${count} records.`);
    process.exit(0);
});
