const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { requireAuth, requireOwnership } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// List all blogs
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        
        const { category, sort } = req.query;
        
        let query = { published: true };
        if (category && category !== 'all') {
            query.categories = { $in: [category] };
        }
        
        let sortOptions = { createdAt: -1 };
        if (sort === 'popular') {
            sortOptions = { views: -1, 'likes.length': -1 };
        } else if (sort === 'oldest') {
            sortOptions = { createdAt: 1 };
        }
        
        const blogs = await Blog.find(query)
            .populate('author', 'username')
            .populate('commentCount')
            .sort(sortOptions)
            .limit(limit)
            .skip(skip);
        
        const total = await Blog.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        
        res.render('blogs/index', {
            title: 'All Blogs',
            blogs,
            currentPage: page,
            totalPages,
            category: category || 'all',
            sort: sort || 'newest',
            categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
        });
    } catch (error) {
        console.error('Error loading blogs:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

// Create blog form
router.get('/create', requireAuth, (req, res) => {
    res.render('blogs/create', {
        title: 'Create New Blog',
        categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
    });
});

// Create blog handler
router.post('/create', requireAuth, upload.array('images', 5), [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title must be less than 200 characters'),
    body('content')
        .notEmpty()
        .withMessage('Content is required'),
    body('categories')
        .notEmpty()
        .withMessage('At least one category is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('blogs/create', {
                title: 'Create New Blog',
                errors: errors.array(),
                formData: req.body,
                categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
            });
        }

        const { title, content, excerpt, categories, tags, published } = req.body;
        
        // Handle images
        let images = [];
        let featuredImage = '';
        
        if (req.files && req.files.length > 0) {
            images = req.files.map((file, index) => ({
                url: `/uploads/${file.filename}`,
                caption: req.body[`imageCaption_${index}`] || '',
                position: index
            }));
            featuredImage = images[0].url; // First image as featured
        }

        const blog = new Blog({
            title,
            content,
            excerpt,
            author: req.session.user._id,
            categories: Array.isArray(categories) ? categories : [categories],
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            images,
            featuredImage,
            published: published === 'true',
            status: published === 'true' ? 'published' : 'draft'
        });

        await blog.save();

        req.flash('success', `Blog ${published === 'true' ? 'published' : 'saved as draft'} successfully!`);
        res.redirect(`/blogs/${blog.slug}`);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.render('blogs/create', {
            title: 'Create New Blog',
            errors: [{ msg: 'Server error. Please try again.' }],
            formData: req.body,
            categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
        });
    }
});

// View single blog
router.get('/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug })
            .populate('author', 'username bio avatar')
            .populate({
                path: 'commentCount'
            });

        if (!blog) {
            return res.status(404).render('error', { error: 'Blog not found' });
        }

        // Check if user can view (published or owns the blog)
        if (!blog.published && (!req.session.user || blog.author._id.toString() !== req.session.user._id)) {
            return res.status(404).render('error', { error: 'Blog not found' });
        }

        // Increment views
        blog.views += 1;
        await blog.save({ validateBeforeSave: false });

        // Get comments
        const comments = await Comment.find({ blog: blog._id, parentComment: null })
            .populate('author', 'username avatar')
            .populate({
                path: 'replies',
                populate: { path: 'author', select: 'username avatar' }
            })
            .sort({ createdAt: -1 });

        // Get related blogs
        const relatedBlogs = await Blog.find({
            _id: { $ne: blog._id },
            categories: { $in: blog.categories },
            published: true
        })
        .populate('author', 'username')
        .limit(3);

        res.render('blogs/show', {
            title: blog.title,
            blog,
            comments,
            relatedBlogs,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Error loading blog:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

// Edit blog form
router.get('/:id/edit', requireAuth, requireOwnership('Blog'), (req, res) => {
    res.render('blogs/edit', {
        title: 'Edit Blog',
        blog: req.resource,
        categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
    });
});

// Update blog
router.put('/:id', requireAuth, requireOwnership('Blog'), upload.array('images', 5), [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title must be less than 200 characters'),
    body('content')
        .notEmpty()
        .withMessage('Content is required'),
    body('categories')
        .notEmpty()
        .withMessage('At least one category is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('blogs/edit', {
                title: 'Edit Blog',
                blog: req.resource,
                errors: errors.array(),
                categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
            });
        }

        const { title, content, excerpt, categories, tags, published } = req.body;
        
        // Handle new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file, index) => ({
                url: `/uploads/${file.filename}`,
                caption: req.body[`imageCaption_${index}`] || '',
                position: req.resource.images.length + index
            }));
            req.resource.images.push(...newImages);
            
            if (!req.resource.featuredImage) {
                req.resource.featuredImage = newImages[0].url;
            }
        }

        req.resource.title = title;
        req.resource.content = content;
        req.resource.excerpt = excerpt;
        req.resource.categories = Array.isArray(categories) ? categories : [categories];
        req.resource.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
        req.resource.published = published === 'true';
        req.resource.status = published === 'true' ? 'published' : 'draft';

        await req.resource.save();

        req.flash('success', 'Blog updated successfully!');
        res.redirect(`/blogs/${req.resource.slug}`);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.render('blogs/edit', {
            title: 'Edit Blog',
            blog: req.resource,
            errors: [{ msg: 'Server error. Please try again.' }],
            categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
        });
    }
});

// Delete blog
router.delete('/:id', requireAuth, requireOwnership('Blog'), async (req, res) => {
    try {
        // Delete associated comments
        await Comment.deleteMany({ blog: req.resource._id });
        
        // Delete the blog
        await Blog.findByIdAndDelete(req.resource._id);

        req.flash('success', 'Blog deleted successfully!');
        res.redirect('/users/dashboard');
    } catch (error) {
        console.error('Error deleting blog:', error);
        req.flash('error', 'Error deleting blog');
        res.redirect(`/blogs/${req.resource.slug}`);
    }
});

// Like/Unlike blog
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        const userLikeIndex = blog.likes.findIndex(
            like => like.user.toString() === req.session.user._id
        );

        if (userLikeIndex > -1) {
            // Unlike
            blog.likes.splice(userLikeIndex, 1);
        } else {
            // Like
            blog.likes.push({ user: req.session.user._id });
        }

        await blog.save();

        res.json({
            success: true,
            liked: userLikeIndex === -1,
            likeCount: blog.likes.length
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add comment
router.post('/:id/comments', requireAuth, [
    body('content')
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 1000 })
        .withMessage('Comment must be less than 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect(`/blogs/${req.params.slug || 'unknown'}`);
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            req.flash('error', 'Blog not found');
            return res.redirect('/blogs');
        }

        const comment = new Comment({
            content: req.body.content,
            author: req.session.user._id,
            blog: blog._id,
            parentComment: req.body.parentComment || null
        });

        await comment.save();

        req.flash('success', 'Comment added successfully!');
        res.redirect(`/blogs/${blog.slug}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        req.flash('error', 'Error adding comment');
        res.redirect('/blogs');
    }
});

module.exports = router;
