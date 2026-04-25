import Booking from '../models/Booking.js';
import Student from '../models/Student.js';
import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import { upsertBookings } from '../utils/bookingHelper.js';

// ─── Cutoff times (per spec) ──────────────────────────────────────────────────
// Breakfast → 7:30 AM  |  Lunch → 12:30 PM  |  Dinner → 6:45 PM
const MEAL_TIMES = {
    Breakfast: { endHour: 10, endMinute: 30, cutoffHour: 7,  cutoffMinute: 30 },
    Lunch:     { endHour: 15, endMinute: 30, cutoffHour: 12, cutoffMinute: 30 },
    Dinner:    { endHour: 22, endMinute: 30, cutoffHour: 18, cutoffMinute: 45 },
};

const CUTOFF_DISPLAY = {
    Breakfast: '7:30 AM',
    Lunch:     '12:30 PM',
    Dinner:    '6:45 PM',
};

// Per-meal refund amounts credited to wallet on cancellation
const MEAL_REFUND = {
    Breakfast: 20,
    Lunch:     32,
    Dinner:    32,
};

// ─── Plan feature matrix (spec) ───────────────────────────────────────────────
// Basic    → view only (no change, no cancel)
// Standard → can change restaurant before cutoff, one-time per meal
// Premium  → can change restaurant + can cancel, both before cutoff, one-time
const PLAN_CAN_CHANGE  = ['Standard', 'Premium'];
const PLAN_CAN_CANCEL  = ['Premium'];

// Get current minutes of the day in IST (Indian Standard Time)
const getISTMinutes = () => {
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
    
    let hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
    
    if (hour === 24) hour = 0;
    return hour * 60 + minute;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isCutoffPassed = (mealType) => {
    const currentMinutes = getISTMinutes();
    const { cutoffHour, cutoffMinute } = MEAL_TIMES[mealType];
    return currentMinutes >= cutoffHour * 60 + cutoffMinute;
};

const isMealPast = (mealType) => {
    const currentMinutes = getISTMinutes();
    const { endHour, endMinute } = MEAL_TIMES[mealType];
    return currentMinutes >= endHour * 60 + endMinute;
};

// Returns true when the serving window is currently open (between service start and end)
// Service start times match MEAL_TIMES cutoff/start:
//   Breakfast: 08:00 - 10:30  |  Lunch: 12:30 - 15:30  |  Dinner: 19:30 - 22:30
const MEAL_SERVICE_START = {
    Breakfast: { startHour: 8,  startMinute: 0  },
    Lunch:     { startHour: 12, startMinute: 30 },
    Dinner:    { startHour: 19, startMinute: 30 },
};

const isMealServing = (mealType) => {
    const currentMinutes = getISTMinutes();
    const { startHour, startMinute } = MEAL_SERVICE_START[mealType];
    const { endHour,   endMinute   } = MEAL_TIMES[mealType];
    const start = startHour * 60 + startMinute;
    const end   = endHour   * 60 + endMinute;
    return currentMinutes >= start && currentMinutes < end;
};

const todayRange = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }); 
    const dateStr = formatter.format(new Date()); // "YYYY-MM-DD"
    
    const start = new Date(`${dateStr}T00:00:00+05:30`);
    const end = new Date(`${dateStr}T23:59:59.999+05:30`);
    return { start, end };
};

// ─── Book / Switch Meal ───────────────────────────────────────────────────────
export const bookMeal = async (req, res) => {
    try {
        const { studentId, restaurantId, mealType } = req.body;

        const student    = await Student.findById(studentId);
        const restaurant = await Restaurant.findById(restaurantId);

        if (!student || !restaurant) {
            return res.status(404).json({ message: 'Student or Restaurant not found' });
        }

        if (isMealPast(mealType)) {
            const { endHour, endMinute } = MEAL_TIMES[mealType];
            return res.status(400).json({
                message: `Booking closed: ${mealType} service ends at ${endHour}:${String(endMinute).padStart(2,'0')}.`
            });
        }

        const plan = student.selectedPlan || 'Basic'; // Basic | Standard | Premium
        const { start, end } = todayRange();

        const existingBooking = await Booking.findOne({
            student: studentId,
            mealType,
            date: { $gte: start, $lte: end }
        });

        // ── Existing booking: this is a restaurant-switch request ──────────────
        if (existingBooking) {
            if (existingBooking.status === 'consumed') {
                return res.status(400).json({ message: 'Meal already consumed.' });
            }
            if (existingBooking.status === 'cancelled') {
                return res.status(400).json({ message: 'This meal has already been cancelled.' });
            }

            // Plan check: must be Standard or Premium to change restaurant
            if (!PLAN_CAN_CHANGE.includes(plan)) {
                return res.status(403).json({
                    message: 'Upgrade your plan. This feature is not available in your current subscription.'
                });
            }

            // Cutoff check
            if (isCutoffPassed(mealType)) {
                return res.status(400).json({
                    message: `Cutoff time exceeded. You can no longer modify this meal.`
                });
            }

            // Already switched — one-time rule enforced
            if (existingBooking.restaurantSwitched) {
                return res.status(400).json({
                    message: 'You have already changed the restaurant for this meal. No further modifications are allowed.'
                });
            }

            // Perform the switch — mark restaurantSwitched so it's locked afterwards
            existingBooking.restaurant = restaurantId;
            existingBooking.restaurantSwitched = true;
            await existingBooking.save();

            // ── Also update the student's defaultRestaurantId ─────────────────────────
            // so tomorrow's 4 AM cron books the new restaurant automatically
            student.defaultRestaurantId = restaurantId;
            await student.save();

            const populated = await Booking.findById(existingBooking._id)
                .populate('student', 'name email phoneNumber')
                .populate('restaurant', 'restaurantName address location');

            // Notify new restaurant owner via socket
            req.io.to(restaurantId).emit('newBooking', populated);

            return res.json({ message: 'Restaurant changed successfully.', booking: populated });
        }

        // ── New booking ────────────────────────────────────────────────────────
        const booking = await Booking.create({
            student: studentId,
            restaurant: restaurantId,
            mealType,
            date: new Date()
        });

        const populated = await Booking.findById(booking._id)
            .populate('student', 'name email phoneNumber')
            .populate('restaurant', 'restaurantName address location');

        req.io.to(restaurantId).emit('newBooking', populated);
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Mark Consumed ────────────────────────────────────────────────────────────
export const markConsumed = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'consumed';
        await booking.save();

        // Notify the student in real-time so their dashboard updates
        req.io.to(booking.student.toString()).emit('mealConsumed', {
            bookingId: booking._id,
            mealType:  booking.mealType,
            status:    'consumed',
        });

        res.json({ message: 'Meal marked as consumed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Cancel Meal ───────────────────────────────────────────────────────────── 
export const cancelMeal = async (req, res) => {
    try {
        const { bookingId, studentId } = req.body;

        if (!bookingId || !studentId) {
            return res.status(400).json({ message: 'bookingId and studentId are required.' });
        }

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // Plan permission check first
        const plan = student.selectedPlan || 'Basic';
        if (!PLAN_CAN_CANCEL.includes(plan)) {
            return res.status(403).json({
                message: 'Upgrade your plan. This feature is not available in your current subscription.'
            });
        }

        const booking = await Booking.findById(bookingId).populate('restaurant');
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        if (booking.student.toString() !== studentId) {
            return res.status(403).json({ message: 'Unauthorized: This booking does not belong to you.' });
        }

        if (booking.status === 'consumed') {
            return res.status(400).json({ message: 'Cannot cancel a meal that has already been consumed.' });
        }
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'This meal is already cancelled.' });
        }

        // After a restaurant switch, no further actions allowed
        if (booking.restaurantSwitched) {
            return res.status(400).json({
                message: 'This meal has been modified (restaurant changed). No further modifications or cancellations are allowed.'
            });
        }

        // Cutoff check
        if (isCutoffPassed(booking.mealType)) {
            return res.status(400).json({
                message: `Cutoff time exceeded. You can no longer modify this meal.`
            });
        }

        // Cancel and refund wallet
        const refundAmount = MEAL_REFUND[booking.mealType] || 0;

        booking.status = 'cancelled';
        await booking.save();

        // Credit refund to student wallet
        student.walletBalance = (student.walletBalance || 0) + refundAmount;
        await student.save();

        res.json({
            message: `${booking.mealType} cancelled successfully. ₹${refundAmount} refunded to your wallet.`,
            refundAmount,
            newWalletBalance: student.walletBalance,
            booking
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Student Meal Status (Dashboard) ──────────────────────────────────────
export const getStudentMealStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId).populate('defaultRestaurantId');

        if (!student) return res.status(404).json({ message: 'Student not found' });

        const { start, end } = todayRange();
        const bookings = await Booking.find({
            student: studentId,
            date: { $gte: start, $lte: end }
        }).populate('restaurant', 'restaurantName cutoffs');

        const plan = student.selectedPlan || 'Basic'; // Basic | Standard | Premium
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

        const status = await Promise.all(mealTypes.map(async type => {
            const booking      = bookings.find(b => b.mealType === type);
            const past         = isMealPast(type);
            const cutoffPassed = isCutoffPassed(type);

            // Plan-level feature flags
            const planCanChange = PLAN_CAN_CHANGE.includes(plan);
            const planCanCancel = PLAN_CAN_CANCEL.includes(plan);

            if (booking) {
                const isActive   = booking.status === 'booked';
                const isConsumed = booking.status === 'consumed';
                const isCancelled= booking.status === 'cancelled';
                const isNotConsumed = booking.status === 'not_consumed';
                const serving    = isMealServing(type);

                // ── Auto-mark not_consumed once window closes ─────────────────
                // If the meal was still 'booked' when the serving window ended,
                // update the DB record immediately — money already deducted.
                if (isActive && past) {
                    booking.status = 'not_consumed';
                    await booking.save();
                }

                // canModify: plan allows change + not cutoff + not already switched + still booked
                const canModify =
                    planCanChange &&
                    !cutoffPassed &&
                    !booking.restaurantSwitched &&
                    isActive;

                // canCancel: plan allows cancel + not cutoff + not already switched + still booked
                const canCancel =
                    planCanCancel &&
                    !cutoffPassed &&
                    !booking.restaurantSwitched &&
                    isActive;

                // Derive the display status
                const displayStatus =
                    (isConsumed || booking.status === 'consumed')   ? 'Consumed'
                  : (isCancelled )                                  ? 'Cancelled'
                  : (isNotConsumed || (isActive && past))           ? 'Not Consumed'
                  : serving                                         ? 'Serving'
                  : booking.restaurant.restaurantName;

                return {
                    mealType:            type,
                    status:              displayStatus,
                    restaurantName:      booking.restaurant.restaurantName,
                    restaurantId:        booking.restaurant._id,
                    bookingId:           booking._id,
                    isLocked:            cutoffPassed,
                    isServing:           serving && isActive,
                    restaurantSwitched:  booking.restaurantSwitched,
                    isModified:          booking.restaurantSwitched,
                    canModify,
                    canCancel,
                    refundAmount:        MEAL_REFUND[type],
                    planName:            plan,
                    planCanChange,
                    planCanCancel,
                    cutoffDisplay:       CUTOFF_DISPLAY[type],
                };
            } else {
                // No booking yet — fall back to default restaurant
                if (student.subscriptionStatus === 'active' && student.defaultRestaurantId) {
                    const serving = isMealServing(type);
                    return {
                        mealType:       type,
                        status:         past ? 'Not Consumed' : serving ? 'Serving' : student.defaultRestaurantId.restaurantName,
                        restaurantName: student.defaultRestaurantId.restaurantName,
                        restaurantId:   student.defaultRestaurantId._id,
                        isLocked:       cutoffPassed,
                        isServing:      serving,
                        isModified:     false,
                        canModify:      planCanChange && !cutoffPassed,
                        canCancel:      false,
                        refundAmount:   MEAL_REFUND[type],
                        isDefault:      true,
                        planName:       plan,
                        planCanChange,
                        planCanCancel,
                        cutoffDisplay:  CUTOFF_DISPLAY[type],
                    };
                }
                return {
                    mealType:      type,
                    status:        past ? 'Not Consumed' : 'Select',
                    isLocked:      past || cutoffPassed,
                    isServing:     false,
                    isModified:    false,
                    canModify:     !past && !cutoffPassed,
                    canCancel:     false,
                    refundAmount:  MEAL_REFUND[type],
                    planName:      plan,
                    planCanChange,
                    planCanCancel,
                    cutoffDisplay: CUTOFF_DISPLAY[type],
                };
            }   // end else (no booking)
        }));   // end Promise.all map


        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Incoming Students (Restaurant Side) ──────────────────────────────────
export const getIncomingStudents = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { start, end } = todayRange();

        // Return ALL statuses so the dashboard can show consumed/cancelled too
        const bookings = await Booking.find({
            restaurant: restaurantId,
            date: { $gte: start, $lte: end },
        }).populate('student', 'name email phoneNumber')
          .sort({ mealType: 1, createdAt: 1 }); // ordered: Breakfast → Lunch → Dinner

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Student Booking History ──────────────────────────────────────────────
export const getStudentBookings = async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log(`[MealHistory] Fetching bookings for student: ${studentId}`);

        const bookings = await Booking.find({ student: studentId })
            .populate('restaurant', 'restaurantName address location')
            .sort({ date: -1 });

        console.log(`[MealHistory] Found ${bookings.length} booking(s)`);

        // Sanitize response: replace null restaurant (deleted) with a placeholder
        const safe = bookings.map(b => ({
            _id:        b._id,
            date:       b.date,
            mealType:   b.mealType,
            status:     b.status,
            restaurantSwitched: b.restaurantSwitched,
            restaurant: b.restaurant
                ? { restaurantName: b.restaurant.restaurantName, address: b.restaurant.address, location: b.restaurant.location }
                : { restaurantName: 'Deleted Restaurant', address: '', location: '' },
        }));

        res.json(safe);
    } catch (error) {
        console.error('[MealHistory] Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Restaurants With Menu for a Meal Type (for Change-Restaurant picker) ─
export const getRestaurantsForMeal = async (req, res) => {
    try {
        const { mealType } = req.params;
        const now = new Date();
        const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dayName   = DAY_NAMES[now.getDay()];
        const { start: todayStart, end: todayEnd } = todayRange();

        const restaurants = await Restaurant.find({ kycStatus: 'approved' }).select('-password');

        const result = await Promise.all(restaurants.map(async (r) => {
            // Prefer single-date override, fall back to weekly routine
            let menu = await Menu.findOne({
                restaurant: r._id,
                mealType,
                menuType: 'single',
                date: { $gte: todayStart, $lte: todayEnd }
            });
            if (!menu) {
                menu = await Menu.findOne({
                    restaurant: r._id,
                    mealType,
                    menuType: 'weekly',
                    dayOfWeek: dayName
                });
            }

            return {
                _id:            r._id,
                restaurantName: r.restaurantName,
                address:        r.address,
                location:       r.location,
                specifications: r.specifications,
                kycStatus:      r.kycStatus,
                menuItems:      menu?.items || []
            };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
