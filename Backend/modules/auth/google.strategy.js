import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../core/config/env.js";
import { authService } from "./auth.service.js";
import logger from "../../core/logger/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID || "placeholder_client_id",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "placeholder_client_secret",
      callbackURL: env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback",

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