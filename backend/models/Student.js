import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    localGuardianName: { type: String, required: true },
    localGuardianPhone: { type: String, required: true },
    hometownAddress: { type: String, required: true },
    college: { type: String },
    location: { type: String },
    budget: { type: String },
    selectedPlan: { type: String },
    subscriptionDate: { type: Date },
    subscriptionEndDate: { type: Date },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'inactive' },
    subscriptionHistory: [{
        planName: String,
        price: Number,
        startDate: Date,
        endDate: Date,
        status: String
    }],
    walletBalance: { type: Number, default: 0 },
    defaultRestaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isProfileComplete: { type: Boolean, default: false },
    role: { type: String, default: 'student' }
}, { timestamps: true });

studentSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
