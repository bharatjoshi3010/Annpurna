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
    walletBalance: { type: Number, default: 0 },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isProfileComplete: { type: Boolean, default: false },
    role: { type: String, default: 'student' }
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
