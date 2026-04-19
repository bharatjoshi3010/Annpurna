import Student from '../models/Student.js';
import Restaurant from '../models/Restaurant.js';

// --- STUDENTS ---

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({}).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            student.name = req.body.name || student.name;
            student.email = req.body.email || student.email;
            student.address = req.body.address || student.address;
            student.phoneNumber = req.body.phoneNumber || student.phoneNumber;
            student.localGuardianName = req.body.localGuardianName || student.localGuardianName;
            student.localGuardianPhone = req.body.localGuardianPhone || student.localGuardianPhone;
            student.hometownAddress = req.body.hometownAddress || student.hometownAddress;
            student.college = req.body.college || student.college;
            student.location = req.body.location || student.location;
            student.budget = req.body.budget || student.budget;
            student.selectedPlan = req.body.selectedPlan || student.selectedPlan;
            student.walletBalance = req.body.walletBalance !== undefined ? req.body.walletBalance : student.walletBalance;
            student.kycStatus = req.body.kycStatus || student.kycStatus;
            
            // You can add a 'flagged' field here if needed, or piggyback on kycStatus ('rejected')

            const updatedStudent = await student.save();
            
            // Emit real-time update
            req.io.to(updatedStudent._id.toString()).emit('kycUpdate', updatedStudent);
            
            res.json(updatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            await Student.deleteOne({ _id: student._id });
            res.json({ message: 'Student removed' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- RESTAURANTS ---

export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({}).select('-password');
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (restaurant) {
            restaurant.ownerName = req.body.ownerName || restaurant.ownerName;
            restaurant.restaurantName = req.body.restaurantName || restaurant.restaurantName;
            restaurant.openingYear = req.body.openingYear || restaurant.openingYear;
            restaurant.address = req.body.address || restaurant.address;
            restaurant.location = req.body.location || restaurant.location;
            restaurant.phoneNumber = req.body.phoneNumber || restaurant.phoneNumber;
            restaurant.fssaiLicense = req.body.fssaiLicense || restaurant.fssaiLicense;
            restaurant.specifications = req.body.specifications || restaurant.specifications;
            restaurant.maxCapacity = req.body.maxCapacity || restaurant.maxCapacity;
            restaurant.walletBalance = req.body.walletBalance !== undefined ? req.body.walletBalance : restaurant.walletBalance;
            restaurant.kycStatus = req.body.kycStatus || restaurant.kycStatus;

            const updatedRestaurant = await restaurant.save();
            
            // Emit real-time update
            req.io.to(updatedRestaurant._id.toString()).emit('kycUpdate', updatedRestaurant);

            res.json(updatedRestaurant);
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (restaurant) {
            await Restaurant.deleteOne({ _id: restaurant._id });
            res.json({ message: 'Restaurant removed' });
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
