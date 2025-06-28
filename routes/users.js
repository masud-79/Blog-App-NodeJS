const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { requireAuth } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// User dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        // Get user's blogs
        const blogs = await Blog.find({ author: userId })
            .populate('commentCount')
            .sort({ createdAt: -1 });
        
        // Get user's comments
        const comments = await Comment.find({ author: userId })
            .populate('blog', 'title slug')
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Get stats
        const stats = {
            totalBlogs: blogs.length,
            publishedBlogs: blogs.filter(b => b.published).length,
            draftBlogs: blogs.filter(b => !b.published).length,
            totalViews: blogs.reduce((sum, blog) => sum + blog.views, 0),
            totalLikes: blogs.reduce((sum, blog) => sum + blog.likes.length, 0),
            totalComments: comments.length
        };

        res.render('users/dashboard', {
            title: 'Dashboard',
            blogs,
            comments,
            stats,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

// User profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        res.render('users/profile', {
            title: 'My Profile',
            user
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

// Update profile
router.put('/profile', requireAuth, upload.single('avatar'), [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const user = await User.findById(req.session.user._id);
            return res.render('users/profile', {
                title: 'My Profile',
                user,
                errors: errors.array()
            });
        }

        const { username, email, bio } = req.body;
        
        // Check if username/email is already taken by another user
        const existingUser = await User.findOne({
            _id: { $ne: req.session.user._id },
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            const user = await User.findById(req.session.user._id);
            return res.render('users/profile', {
                title: 'My Profile',
                user,
                errors: [{ msg: 'Username or email is already taken' }]
            });
        }

        const updateData = { username, email, bio };
        
        // Handle avatar upload
        if (req.file) {
            updateData.avatar = `/uploads/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(
            req.session.user._id,
            updateData,
            { new: true }
        );

        // Update session
        req.session.user.username = user.username;
        req.session.user.email = user.email;

        req.flash('success', 'Profile updated successfully!');
        res.redirect('/users/profile');
    } catch (error) {
        console.error('Profile update error:', error);
        const user = await User.findById(req.session.user._id);
        res.render('users/profile', {
            title: 'My Profile',
            user,
            errors: [{ msg: 'Server error. Please try again.' }]
        });
    }
});

// Change password
router.post('/change-password', requireAuth, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const user = await User.findById(req.session.user._id);
            return res.render('users/profile', {
                title: 'My Profile',
                user,
                passwordErrors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.user._id);

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.render('users/profile', {
                title: 'My Profile',
                user,
                passwordErrors: [{ msg: 'Current password is incorrect' }]
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        req.flash('success', 'Password changed successfully!');
        res.redirect('/users/profile');
    } catch (error) {
        console.error('Password change error:', error);
        const user = await User.findById(req.session.user._id);
        res.render('users/profile', {
            title: 'My Profile',
            user,
            passwordErrors: [{ msg: 'Server error. Please try again.' }]
        });
    }
});

// Public user profile
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' });
        }

        const blogs = await Blog.find({ 
            author: user._id, 
            published: true 
        })
        .populate('commentCount')
        .sort({ createdAt: -1 });

        const stats = {
            totalBlogs: blogs.length,
            totalViews: blogs.reduce((sum, blog) => sum + blog.views, 0),
            totalLikes: blogs.reduce((sum, blog) => sum + blog.likes.length, 0)
        };

        res.render('users/public-profile', {
            title: `${user.username}'s Profile`,
            profileUser: user,
            blogs,
            stats,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Public profile error:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

module.exports = router;
