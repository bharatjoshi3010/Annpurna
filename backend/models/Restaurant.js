const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const restaurantSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ownerName: { type: String },
    restaurantName: { type: String },
    address: { type: String },
    location: { type: String },
    phoneNumber: { type: String },
    fssaiLicense: { type: String },
    specifications: { type: String },
    maxCapacity: { type: Number },
    isProfileComplete: { type: Boolean, default: false },
    role: { type: String, default: 'restaurant' }
}, { timestamps: true });

restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

restaurantSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
