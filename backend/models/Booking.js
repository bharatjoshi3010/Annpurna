import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['booked', 'consumed', 'cancelled'],
        default: 'booked'
    }
}, { timestamps: true });

// Ensure a student can only book one restaurant per meal per day
bookingSchema.index({ student: 1, mealType: 1, date: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
