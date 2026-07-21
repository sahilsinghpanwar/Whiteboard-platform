import express from "express";
import passport from "passport";

import { authController } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import validate from "../../core/middleware/validation.middleware.js";
import protect from "../../core/middleware/auth.middleware.js";
import asyncHandler from "../../core/utils/asyncHandler.js";

import { env } from "../../core/config/env.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login)
);


router.get(
  "/me",
  protect,
  asyncHandler(authController.getProfile)
);

router.post(
  "/logout",
  protect,
  asyncHandler(authController.logout)
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, 
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=google_oauth_failed`,
  }),
  asyncHandler(authController.googleCallback)
);

export default router;