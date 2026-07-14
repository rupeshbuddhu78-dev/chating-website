const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Configure Passport strategies. Only Google OAuth is registered here.
 * Local login uses our own controller with JWT.
 */
module.exports = function configurePassport(passport) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const u = await User.findById(id);
      done(null, u);
    } catch (e) {
      done(e);
    }
  });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[Passport] Google OAuth env not set — Google login disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error('Google account missing email'));

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
          if (!user) {
            user = await User.create({
              name: profile.displayName || 'User',
              email,
              googleId: profile.id,
              profileImage: profile.photos?.[0]?.value,
              isVerified: true
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            if (!user.profileImage && profile.photos?.[0]?.value) {
              user.profileImage = profile.photos[0].value;
            }
            await user.save();
          }
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
};
