import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import envConfig from './env.config.js';
import { getUserByGoogleId, getUserByEmail, createUser, updateUser } from '../dao/user.dao.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: envConfig.GOOGLE_CLIENT_ID,
            clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
            callbackURL:
                envConfig.GOOGLE_CALLBACK_URL || envConfig.SERVER_URL + '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails?.[0]?.value?.toLowerCase();

                if (!email) {
                    return done(new Error('No email found in Google profile'), null);
                }

                // 1. Find user by googleId
                let user = await getUserByGoogleId(googleId, true);
                if (user) {
                    if (user.isDeleted) {
                        return done(new Error('This account has been deleted'), null);
                    }
                    return done(null, user);
                }

                // 2. Find user by email (linking strategy)
                user = await getUserByEmail(email, true);
                if (user) {
                    if (user.isDeleted) {
                        return done(new Error('This account has been deleted'), null);
                    }
                    // Link Google ID to existing account
                    user = await updateUser(user.id, { googleId });
                    return done(null, user);
                }

                // 3. Create new user
                const firstName = profile.name?.givenName || profile.displayName || 'Google';
                const lastName = profile.name?.familyName || 'User';
                const profileImage = profile.photos?.[0]?.value;

                user = await createUser({
                    email,
                    googleId,
                    firstName,
                    lastName,
                    profileImage,
                    emailVerified: true,
                    isActive: true,
                    isDeleted: false,
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        },
    ),
);

export default passport;
