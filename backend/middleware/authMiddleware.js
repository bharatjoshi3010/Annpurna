import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Restaurant from '../models/Restaurant.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Role-Based User Fetching
            if (decoded.role === 'student') {
                req.user = await Student.findById(decoded.id).select('-password');
            } else if (decoded.role === 'restaurant') {
                req.user = await Restaurant.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user.role = decoded.role;
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // No token present
    return res.status(401).json({ message: 'Not authorized, no token' });
};

export { protect };
