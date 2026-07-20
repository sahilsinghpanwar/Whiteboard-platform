import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { authService } from "../../modules/auth/auth.service.js";
import logger from "../logger/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,

      scope: ["profile", "email"],
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleProfile = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          fullName: profile.displayName,
          profileImageUrl: profile.photos?.[0]?.value || null,
        };

        if (!googleProfile.email) {
          return done(new Error("No email returned from Google profile"), null);
        }

        const authPayload = await authService.loginOrRegisterWithGoogle(googleProfile);

        done(null, authPayload);
      } catch (error) {
        logger.error("Google OAuth strategy error", { error: error.message });
        done(error, null);
      }
    }
  )
);

export default passport;