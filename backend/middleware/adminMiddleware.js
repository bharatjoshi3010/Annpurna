import jwt from 'jsonwebtoken';

/**
 * Middleware that protects admin-only routes.
 * Expects:  Authorization: Bearer <token>
 * Token must have been issued by /api/admin/login (role === 'admin').
 */
const protectAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized — no admin token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden — admins only' });
        }

        req.admin = decoded; // { id: 'admin', role: 'admin' }
        next();
    } catch {
        res.status(401).json({ message: 'Not authorized — invalid or expired token' });
    }
};

export { protectAdmin };
