import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { getRoleFromEmail, getBatchFromEmail } from '../controllers/authController.js';

// Load environment variables
dotenv.config();

passport.serializeUser((user, done) => {
   done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
   try {
      const user = await User.findById(id);
      done(null, user);
   } catch (error) {
      done(error, null);
   }
});

passport.use(
   new GoogleStrategy(
      {
         clientID: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: '/api/auth/google/callback',
         proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
         try {
            const email = profile.emails[0].value;
            
            // Validate email domain
            if (!email.endsWith('@charusat.edu.in') && !email.endsWith('@charusat.ac.in')) {
               return done(null, false, { 
                  message: 'Access denied. Only @charusat.edu.in and @charusat.ac.in emails are allowed.' 
               });
            }

            // Check if user exists
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
               // Check if user exists with same email (registered with password)
               user = await User.findOne({ email: email.toLowerCase() });
               
               if (user) {
                  // Link Google account to existing user
                  user.googleId = profile.id;
                  user.authProvider = 'google';
                  if (!user.profilePicture) {
                     user.profilePicture = profile.photos[0]?.value || '';
                  }
                  await user.save();
               } else {
                  // Create new user with auto-detected role and batch
                  user = await User.create({
                     googleId: profile.id,
                     email: email.toLowerCase(),
                     name: profile.displayName,
                     profilePicture: profile.photos[0]?.value || '',
                     authProvider: 'google',
                     role: getRoleFromEmail(email),
                     batch: getBatchFromEmail(email)
                  });
               }
            }

            return done(null, user);
         } catch (error) {
            return done(error, null);
         }
      }
   )
);

export default passport;
