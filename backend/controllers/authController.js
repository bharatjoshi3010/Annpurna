const Student = require('../models/Student');
const Restaurant = require('../models/Restaurant');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (Student or Restaurant)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    if (role !== 'student' && role !== 'restaurant') {
        return res.status(400).json({ message: 'Role must be either student or restaurant' });
    }

    try {
        let userExists;
        if (role === 'student') {
            userExists = await Student.findOne({ email });
        } else {
            userExists = await Restaurant.findOne({ email });
        }

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let user;
        if (role === 'student') {
            user = await Student.create({ email, password, role });
        } else {
            user = await Restaurant.create({ email, password, role });
        }

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    try {
        let user;

        if (role === 'student') {
            user = await Student.findOne({ email });
        } else if (role === 'restaurant') {
            user = await Restaurant.findOne({ email });
        } else {
            return res.status(400).json({ message: 'Role must be either student or restaurant' });
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const {
        name, phoneNumber, college, location, budget, selectedPlan,
        ownerName, restaurantName, address, fssaiLicense, specifications, maxCapacity
    } = req.body;

    try {
        let user;

        if (req.user.role === 'student') {
            user = await Student.findById(req.user._id);
            if (user) {
                user.name = name || user.name;
                user.phoneNumber = phoneNumber || user.phoneNumber;
                user.college = college || user.college;
                user.location = location || user.location;
                user.budget = budget || user.budget;
                user.selectedPlan = selectedPlan || user.selectedPlan;
                user.isProfileComplete = true; // Mark as complete once details are provided

                const updatedUser = await user.save();
                res.json({
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    phoneNumber: updatedUser.phoneNumber,
                    college: updatedUser.college,
                    location: updatedUser.location,
                    budget: updatedUser.budget,
                    selectedPlan: updatedUser.selectedPlan,
                    isProfileComplete: updatedUser.isProfileComplete,
                    role: updatedUser.role,
                    token: generateToken(updatedUser._id, updatedUser.role),
                });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } else if (req.user.role === 'restaurant') {
            user = await Restaurant.findById(req.user._id);
            if (user) {
                user.ownerName = ownerName || user.ownerName;
                user.restaurantName = restaurantName || user.restaurantName;
                user.address = address || user.address;
                user.location = location || user.location;
                user.phoneNumber = phoneNumber || user.phoneNumber;
                user.fssaiLicense = fssaiLicense || user.fssaiLicense;
                user.specifications = specifications || user.specifications;
                user.maxCapacity = maxCapacity || user.maxCapacity;
                user.isProfileComplete = true;

                const updatedUser = await user.save();
                res.json({
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    ownerName: updatedUser.ownerName,
                    restaurantName: updatedUser.restaurantName,
                    address: updatedUser.address,
                    location: updatedUser.location,
                    fssaiLicense: updatedUser.fssaiLicense,
                    specifications: updatedUser.specifications,
                    maxCapacity: updatedUser.maxCapacity,
                    isProfileComplete: updatedUser.isProfileComplete,
                    role: updatedUser.role,
                    token: generateToken(updatedUser._id, updatedUser.role),
                });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        let user;
        if (req.user.role === 'student') {
            user = await Student.findById(req.user._id).select('-password');
        } else if (req.user.role === 'restaurant') {
            user = await Restaurant.findById(req.user._id).select('-password');
        }

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, updateProfile, getProfile };
