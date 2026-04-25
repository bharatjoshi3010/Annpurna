import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directories exist
const UPLOAD_DIR = 'uploads';
const DIRS = ['uploads', 'uploads/student-ids', 'uploads/fssai-certs', 'uploads/registration-certs'];
DIRS.forEach((dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// ---------- Storage ----------
const storage = multer.diskStorage({
    destination(req, file, cb) {
        let folder = UPLOAD_DIR;
        if (file.fieldname === 'studentIdCard')           folder = 'uploads/student-ids';
        else if (file.fieldname === 'fssaiCertificate')  folder = 'uploads/fssai-certs';
        else if (file.fieldname === 'registrationCertificate') folder = 'uploads/registration-certs';
        cb(null, folder);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// ---------- File type check (images only) ----------
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname  = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only JPG/JPEG/PNG images are allowed'));
}

// ---------- Multer instance with 1 MB limit ----------
const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
    fileFilter(req, file, cb) {
        checkFileType(file, cb);
    },
});

// ── Generic single image (legacy route) ──────────────────────────────────────
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    res.json({
        message: 'Image uploaded successfully',
        image: `/uploads/${req.file.filename}`,
    });
});

// ── Student ID card ───────────────────────────────────────────────────────────
router.post('/student-id', upload.single('studentIdCard'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    res.json({
        message: 'Student ID card uploaded successfully',
        image: `/uploads/student-ids/${req.file.filename}`,
    });
});

// ── FSSAI Certificate ─────────────────────────────────────────────────────────
router.post('/fssai-cert', upload.single('fssaiCertificate'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    res.json({
        message: 'FSSAI certificate uploaded successfully',
        image: `/uploads/fssai-certs/${req.file.filename}`,
    });
});

// ── Business Registration Certificate ────────────────────────────────────────
router.post('/registration-cert', upload.single('registrationCertificate'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    res.json({
        message: 'Registration certificate uploaded successfully',
        image: `/uploads/registration-certs/${req.file.filename}`,
    });
});

// ---------- Global multer error handler ----------
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 1 MB limit' });
    }
    if (err) {
        return res.status(400).json({ message: err.message || 'Upload error' });
    }
    next();
});

export default router;
