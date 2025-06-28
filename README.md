# Modern Blog Hub - Full-Stack Blog Application

A comprehensive blog platform built with Node.js, Express, MongoDB, and EJS templating. Features user authentication, rich text editing, image uploads, commenting system, and modern responsive UI.

## 🚀 Features

### Core Features
- **User Authentication**: Registration, login, logout with secure sessions
- **Blog Management**: Full CRUD operations for blog posts
- **Rich Text Editor**: Quill.js integration for formatted content
- **Image Upload**: Multiple image support with automatic resizing
- **Categories**: 6 predefined categories (Arts & Culture, Science & Technology, History, Politics, Sports, Social)
- **Search & Filter**: Advanced search and category filtering
- **Comments System**: Nested comments with like functionality
- **Like System**: Like/unlike blogs and comments
- **User Profiles**: Customizable user profiles with avatars

### Technical Features
- **Responsive Design**: Mobile-first approach with Bootstrap 5
- **Modern UI/UX**: Clean, attractive design with smooth animations
- **SEO Friendly**: Semantic HTML and meta tags
- **Security**: Password hashing, input validation, XSS protection
- **File Upload**: Multer integration for image handling
- **Session Management**: Secure session storage with MongoDB
- **Error Handling**: Comprehensive error pages and validation

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **EJS** - Templating engine
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **express-session** - Session management

### Frontend
- **Bootstrap 5** - CSS framework
- **Font Awesome 6** - Icons
- **Quill.js** - Rich text editor
- **Google Fonts** - Typography
- **Custom CSS** - Enhanced styling

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/modern-blog-hub.git
   cd modern-blog-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and edit it:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual values:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/blogapp
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## 📁 Project Structure

```
Blog_App_Node.js/
├── config/
│   └── multer.js              # File upload configuration
├── middleware/
│   └── auth.js                # Authentication middleware
├── models/
│   ├── User.js                # User model
│   ├── Blog.js                # Blog model
│   └── Comment.js             # Comment model
├── public/
│   ├── css/
│   │   └── style.css          # Custom styles
│   ├── js/
│   │   └── main.js            # Frontend JavaScript
│   └── uploads/               # Uploaded images
├── routes/
│   ├── auth.js                # Authentication routes
│   ├── blogs.js               # Blog routes
│   └── users.js               # User routes
├── views/
│   ├── auth/
│   │   ├── login.ejs          # Login page
│   │   └── register.ejs       # Registration page
│   ├── blogs/
│   │   ├── create.ejs         # Blog creation form
│   │   ├── edit.ejs           # Blog editing form
│   │   ├── index.ejs          # Blog listing
│   │   └── show.ejs           # Single blog view
│   ├── users/
│   │   ├── dashboard.ejs      # User dashboard
│   │   ├── profile.ejs        # User profile
│   │   └── public-profile.ejs # Public user profile
│   ├── index.ejs              # Homepage
│   ├── error.ejs              # Error page
│   └── search.ejs             # Search results
├── .env                       # Environment variables
├── .gitignore                 # Git ignore file
├── package.json               # Project dependencies
└── server.js                  # Main server file
```

## 🎯 Usage Guide

### For Users
1. **Register**: Create a new account with username, email, and password
2. **Login**: Access your account with email and password
3. **Create Blog**: Use the rich text editor to write and format your blog
4. **Add Images**: Upload multiple images to enhance your blog
5. **Categorize**: Select appropriate categories for your content
6. **Publish**: Choose to publish immediately or save as draft
7. **Interact**: Like and comment on other users' blogs

### For Developers
1. **Models**: Extend or modify the Mongoose schemas
2. **Routes**: Add new endpoints in the routes directory
3. **Views**: Customize the EJS templates
4. **Styles**: Modify the CSS for design changes
5. **Middleware**: Add custom middleware for additional functionality

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **Session Security**: Secure session configuration
- **Input Validation**: express-validator for form validation
- **XSS Protection**: HTML sanitization
- **File Upload Security**: File type and size restrictions
- **Authentication**: Route protection middleware

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience
- **Tablet**: Adapted layout with touch-friendly interface
- **Mobile**: Optimized for small screens with hamburger menu

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional appearance
- **Smooth Animations**: CSS transitions and hover effects
- **Loading States**: Progress indicators for file uploads
- **Toast Notifications**: User feedback for actions
- **Dark Mode Ready**: CSS variables for easy theme switching
- **Accessibility**: ARIA labels and keyboard navigation

## 📊 Performance Optimization

- **Image Optimization**: Responsive images with proper sizing
- **Lazy Loading**: Images load on demand
- **Minified Assets**: Compressed CSS and JavaScript
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Session and static file caching

## 🧪 Testing

Run the application in development mode and test:
- User registration and authentication
- Blog creation, editing, and deletion
- Image upload functionality
- Search and filtering
- Comment and like systems
- Responsive design on different devices

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your environment
2. Use a production MongoDB instance
3. Configure proper session secrets
4. Set up SSL/HTTPS for production

### Platform Deployment
- **Heroku**: Use the provided Procfile
- **Vercel**: Configure for Node.js deployment
- **DigitalOcean**: Deploy on a VPS
- **AWS**: Use Elastic Beanstalk or EC2

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Portfolio Showcase

This project demonstrates:
- **Full-Stack Development**: Complete MEAN/MERN-like stack
- **Database Design**: Proper schema relationships
- **User Experience**: Intuitive and engaging interface
- **Code Quality**: Clean, maintainable, and documented code
- **Security Best Practices**: Production-ready security measures
- **Responsive Design**: Cross-device compatibility

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🙏 Acknowledgments

- [Bootstrap](https://getbootstrap.com/) for the CSS framework
- [Quill.js](https://quilljs.com/) for the rich text editor
- [Font Awesome](https://fontawesome.com/) for icons
- [MongoDB](https://www.mongodb.com/) for the database
- [Express.js](https://expressjs.com/) for the web framework

---

**Made with ❤️ for portfolio demonstration**
