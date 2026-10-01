import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnect from './config/DbConnect.js';
import passport from './config/passport.js';
import { initializeSocket } from './config/socket.js';
import authRoutes from './routes/auth.js';
import otpRoutes from './routes/otp.js';
import settingsRoutes from './routes/settings.js';
import connectionRoutes from './routes/connections.js';
import chatRoutes from './routes/chat.js';
import groupChatRoutes from './routes/groupChat.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';
import postRoutes from './routes/posts.js';
import reunionRoutes from './routes/reunions.js';
import emailOtpRoutes from './routes/emailOtp.js';
import adminRoutes from './routes/admin.js';
import galleryRoutes from './routes/gallery.js';
import feedbackRoutes from './routes/feedback.js';
import donationRoutes from './routes/donation.js';
import internshipRoutes from './routes/internship.js';
import RolePermission from './models/RolePermission.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// MongoDB connection string for session store
const MONGODB_URI = process.env.DB_URL || 'mongodb://localhost:27017/campusroots';

// Initialize Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
   cors({
      credentials: true,
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
   })
);

// Session configuration with MongoDB store
app.use(
   session({
      secret: process.env.SESSION_SECRET || 'campusroots-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
         mongoUrl: MONGODB_URI,
         collectionName: 'sessions',
         ttl: 7 * 24 * 60 * 60, // 7 days
         autoRemove: 'native',
         touchAfter: 24 * 3600 // Update session once per day if unchanged
      }),
      cookie: {
         secure: process.env.NODE_ENV === 'production',
         httpOnly: true,
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
      }
   })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB and seed RBAC defaults
dbConnect().then(async () => {
   try {
      await RolePermission.seedDefaults();
   } catch (err) {
      console.error('❌ RBAC seed error:', err);
   }
});

// Routes
app.get('/', (req, res) => {
   res.json({ 
      message: 'Welcome to CampusRoots - Alumni Meetup Platform API',
      status: 'Server is running successfully'
   });
});

app.get('/api/health', (req, res) => {
   res.json({ 
      status: 'OK', 
      message: 'CampusRoots server is healthy',
      timestamp: new Date().toISOString()
   });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Email OTP routes (for signup verification)
app.use('/api/email-otp', emailOtpRoutes);

// OTP routes
app.use('/api/otp', otpRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// Connection routes
app.use('/api/connections', connectionRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Group chat routes
app.use('/api/groups', groupChatRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Reunion routes
app.use('/api/reunions', reunionRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Gallery routes
app.use('/api/gallery', galleryRoutes);

// Feedback routes
app.use('/api/feedback', feedbackRoutes);

// Donation routes
app.use('/api/donation', donationRoutes);

// Internship routes
app.use('/api/internships', internshipRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
   console.error('❌ Error:', err);
   res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
   });
});

// Start server
server.listen(PORT, () => {
   console.log(`📍 API URL: http://localhost:${PORT}`);
});