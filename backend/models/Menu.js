import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    menuType: {
        type: String,
        enum: ['weekly', 'single'],
        required: true
    },
    // For weekly routine
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    // For single time choice
    date: {
        type: Date
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner'],
        required: true
    },
    items: [{
        name: { type: String, required: true },
        description: { type: String }
    }]
}, { timestamps: true });

// Ensure unique menu per restaurant per day/meal
menuSchema.index({ restaurant: 1, menuType: 1, dayOfWeek: 1, date: 1, mealType: 1 }, { unique: true });

const Menu = mongoose.model('Menu', menuSchema);
export default Menu;
