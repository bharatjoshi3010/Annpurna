import Booking from '../models/Booking.js';
import Student from '../models/Student.js';
import Restaurant from '../models/Restaurant.js';

const MEAL_TIMES = {
    Breakfast: { endHour: 10, endMinute: 30, cutoff: '08:00' }, // Ends 10:30 AM, Cutoff 08:00 AM
    Lunch: { endHour: 15, endMinute: 30, cutoff: '10:00' },     // Ends 3:30 PM, Cutoff 10:00 AM
    Dinner: { endHour: 22, endMinute: 30, cutoff: '17:00' }     // Ends 10:30 PM, Cutoff 05:00 PM
};

const isMealPast = (mealType) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const config = MEAL_TIMES[mealType];
    const endMinutes = config.endHour * 60 + config.endMinute;
    return currentMinutes >= endMinutes;
};

export const bookMeal = async (req, res) => {
    try {
        const { studentId, restaurantId, mealType } = req.body;

        // Verify student and restaurant exist
        const student = await Student.findById(studentId);
        const restaurant = await Restaurant.findById(restaurantId);

        if (!student || !restaurant) {
            return res.status(404).json({ message: 'Student or Restaurant not found' });
        }

        // Time Check
        if (isMealPast(mealType)) {
            const config = MEAL_TIMES[mealType];
            return res.status(400).json({ 
                message: `Booking Closed: ${mealType} ended at ${config.endHour}:${config.endMinute || '00'}` 
            });
        }

        // Get today's start and end date
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // Check if already booked for this meal today
        const existingBooking = await Booking.findOne({
            student: studentId,
            mealType,
            date: { $gte: start, $lte: end }
        });

        if (existingBooking) {
            if (existingBooking.status === 'consumed') {
                return res.status(400).json({ message: 'Meal already consumed' });
            }
            // Update existing booking to a new restaurant if they change their mind
            existingBooking.restaurant = restaurantId;
            await existingBooking.save();
            
            const populatedBooking = await Booking.findById(existingBooking._id)
                .populate('student', 'name email phoneNumber')
                .populate('restaurant', 'restaurantName address location');
            
            req.io.to(restaurantId).emit('newBooking', populatedBooking);
            return res.json(populatedBooking);
        }

        const booking = await Booking.create({
            student: studentId,
            restaurant: restaurantId,
            mealType,
            date: new Date()
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('student', 'name email phoneNumber')
            .populate('restaurant', 'restaurantName address location');

        req.io.to(restaurantId).emit('newBooking', populatedBooking);
        res.status(201).json(populatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markConsumed = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'consumed';
        await booking.save();

        res.json({ message: 'Meal marked as consumed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const isCutoffPassed = (mealType, restaurant) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Get cutoff from restaurant settings or system defaults
    const cutoffStr = restaurant?.cutoffs?.[mealType.toLowerCase()] || MEAL_TIMES[mealType].cutoff;
    const [hours, minutes] = cutoffStr.split(':').map(Number);
    const cutoffMinutes = hours * 60 + minutes;

    return currentMinutes >= cutoffMinutes;
};

export const getStudentMealStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId).populate('defaultRestaurantId');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            student: studentId,
            date: { $gte: start, $lte: end }
        }).populate('restaurant', 'restaurantName cutoffs');

        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        const status = mealTypes.map(type => {
            const booking = bookings.find(b => b.mealType === type);
            const past = isMealPast(type);
            
            // Check if cutoff is passed for the restaurant (either booked or default)
            const activeRestaurant = booking?.restaurant || student.defaultRestaurantId;
            const cutoffPassed = isCutoffPassed(type, activeRestaurant);

            if (booking) {
                return { 
                    mealType: type, 
                    status: booking.status === 'consumed' ? 'Consumed' : (past ? 'Not Consumed' : (booking.status === 'cancelled' ? 'Cancelled' : booking.restaurant.restaurantName)),
                    restaurantName: booking.restaurant.restaurantName,
                    restaurantId: booking.restaurant._id,
                    bookingId: booking._id,
                    isLocked: cutoffPassed,
                    canModify: !cutoffPassed && booking.status === 'booked'
                };
            } else {
                // If no booking, and we have a default restaurant + active plan
                if (student.subscriptionStatus === 'active' && student.defaultRestaurantId) {
                    return {
                        mealType: type,
                        status: past ? 'Not Consumed' : student.defaultRestaurantId.restaurantName,
                        restaurantName: student.defaultRestaurantId.restaurantName,
                        restaurantId: student.defaultRestaurantId._id,
                        isLocked: cutoffPassed,
                        canModify: !cutoffPassed,
                        isDefault: true
                    };
                }
                
                return { 
                    mealType: type, 
                    status: past ? 'Not Consumed' : 'Select',
                    isLocked: past || cutoffPassed,
                    canModify: !past && !cutoffPassed
                };
            }
        });

        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getIncomingStudents = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            restaurant: restaurantId,
            date: { $gte: start, $lte: end },
            status: 'booked'
        }).populate('student', 'name email phoneNumber');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentBookings = async (req, res) => {
    try {
        const { studentId } = req.params;

        const bookings = await Booking.find({
            student: studentId
        })
        .populate('restaurant', 'restaurantName address location')
        .sort({ date: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
