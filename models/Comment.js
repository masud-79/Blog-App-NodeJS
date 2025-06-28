const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
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
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Virtual for replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
