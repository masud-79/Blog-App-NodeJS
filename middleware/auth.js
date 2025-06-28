// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Please log in to access this page');
    res.redirect('/auth/login');
};

// Redirect if already authenticated
const redirectIfAuth = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    next();
};

// Check if user owns the resource
const requireOwnership = (model) => {
    return async (req, res, next) => {
        try {
            const Model = require(`../models/${model}`);
            const resource = await Model.findById(req.params.id);
            
            if (!resource) {
                return res.status(404).render('error', { error: 'Resource not found' });
            }
            
            if (resource.author.toString() !== req.session.user._id) {
                return res.status(403).render('error', { error: 'Access denied' });
            }
            
            req.resource = resource;
            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).render('error', { error: 'Server error' });
        }
    };
};

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).render('error', { error: 'Admin access required' });
};

module.exports = {
    requireAuth,
    redirectIfAuth,
    requireOwnership,
    requireAdmin
};
