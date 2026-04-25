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
    cutoffs: {
        breakfast: { type: String, default: '07:00' },
        lunch: { type: String, default: '10:00' },
        dinner: { type: String, default: '17:00' }
    },
    fssaiCertificate: { type: String },           // URL path to uploaded FSSAI certificate image
    registrationCertificate: { type: String },    // URL path to uploaded business registration cert image
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isProfileComplete: { type: Boolean, default: false },
    role: { type: String, default: 'restaurant' }
}, { timestamps: true });

restaurantSchema.pre('save', async function () {
    //pre('save') means: “Run this function before saving a document in DB”
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

restaurantSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};    //It checks if the entered password matches the stored (hashed) password.

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
