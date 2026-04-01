import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const restaurantSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ownerName: { type: String, required: true },
    restaurantName: { type: String, required: true },
    openingYear: { type: Number, required: true },
    address: { type: String, required: true },
    location: { type: String },
    phoneNumber: { type: String, required: true },
    fssaiLicense: { type: String },
    specifications: { type: String },
    maxCapacity: { type: Number, required: true },
    walletBalance: { type: Number, default: 0 },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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
export default Restaurant;
