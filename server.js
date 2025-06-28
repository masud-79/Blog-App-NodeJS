require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true // Prevent XSS attacks
    }
}));

app.use(flash());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Global middleware for user data
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.messages = req.flash();
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const userRoutes = require('./routes/users');

app.use('/auth', authRoutes);
app.use('/blogs', blogRoutes);
app.use('/users', userRoutes);

// Home route
app.get('/', async (req, res) => {
    try {
        const Blog = require('./models/Blog');
        const blogs = await Blog.find({ published: true })
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(6);
        
        res.render('index', { 
            title: 'Modern Blog Hub',
            blogs,
            categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
        });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).render('error', { error: 'Server Error' });
    }
});

// Search route
app.get('/search', async (req, res) => {
    try {
        const { q, category } = req.query;
        const Blog = require('./models/Blog');
        
        let query = { published: true };
        
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { categories: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (category && category !== 'all') {
            query.categories = { $in: [category] };
        }
        
        const blogs = await Blog.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 });
        
        res.render('search', {
            title: 'Search Results',
            blogs,
            searchQuery: q || '',
            selectedCategory: category || 'all',
            categories: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social']
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', { error: 'Search Error' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { error: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
