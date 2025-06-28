const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        maxlength: 300
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categories: [{
        type: String,
        enum: ['Arts and Culture', 'Science and Technology', 'History', 'Politics', 'Sports', 'Social'],
        required: true
    }],
    tags: [{
        type: String,
        trim: true
    }],
    featuredImage: {
        type: String,
        default: ''
    },
    images: [{
        url: String,
        caption: String,
        position: Number
    }],
    published: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    views: {
        type: Number,
        default: 0
    },
    readTime: {
        type: Number, // in minutes
        default: 1
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, {
    timestamps: true
});

// Create slug before saving
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
        
        // Add timestamp to ensure uniqueness
        if (this.isNew) {
            this.slug += '-' + Date.now();
        }
    }
    
    // Generate excerpt from content if not provided
    if (!this.excerpt && this.content) {
        const plainText = this.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        this.excerpt = plainText.substring(0, 297) + '...';
    }
    
    // Calculate read time (average 200 words per minute)
    if (this.content) {
        const wordCount = this.content.split(' ').length;
        this.readTime = Math.ceil(wordCount / 200);
    }
    
    // Set published date
    if (this.published && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Virtual for comment count
blogSchema.virtual('commentCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'blog',
    count: true
});

// Ensure virtuals are included in JSON
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

// Index for search
blogSchema.index({ title: 'text', content: 'text', categories: 'text' });

// Additional indexes for performance (slug already has index: true)
blogSchema.index({ author: 1 });
blogSchema.index({ published: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ categories: 1 });

module.exports = mongoose.model('Blog', blogSchema);
