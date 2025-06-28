const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth, redirectIfAuth } = require('../middleware/auth');

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

// Apply rate limiting to login and register routes
router.use('/login', authLimiter);
router.use('/register', authLimiter);

// Registration page
router.get('/register', redirectIfAuth, (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Registration handler
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/register', {
                title: 'Register',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                errors: [{ msg: 'User with this email or username already exists' }],
                formData: req.body
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            errors: [{ msg: 'Server error. Please try again.' }],
            formData: req.body
        });
    }
});

// Login page
router.get('/login', redirectIfAuth, (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Login handler
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/login', {
                title: 'Login',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                errors: [{ msg: 'Invalid email or password' }],
                formData: req.body
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                errors: [{ msg: 'Invalid email or password' }],
                formData: req.body
            });
        }

        // Create session
        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        req.flash('success', `Welcome back, ${user.username}!`);
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            errors: [{ msg: 'Server error. Please try again.' }],
            formData: req.body
        });
    }
});

// Logout handler
router.post('/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

module.exports = router;
