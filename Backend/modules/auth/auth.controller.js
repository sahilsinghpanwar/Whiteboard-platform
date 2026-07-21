import { authService } from "./auth.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import { getRefreshTokenCookieOptions } from "../../core/utils/jwt.js";
import { env } from "../../core/config/env.js";

const sendAuthResponse = (res, statusCode, message, authPayload) => {
  const { accessToken, refreshToken, user } = authPayload;

  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  const userJson = user?.toPublicJSON ? user.toPublicJSON() : user;

  return res.status(statusCode).json(
    new ApiResponse(statusCode, message, { accessToken, refreshToken, user: userJson })
  );
};

const register = async (req, res) => {
  const authPayload = await authService.registerWithEmailPassword(req.body);
  return sendAuthResponse(res, 201, "Account created successfully", authPayload);
};

const login = async (req, res) => {
  const authPayload = await authService.loginWithEmailPassword(req.body);
  return sendAuthResponse(res, 200, "Logged in successfully", authPayload);
};

const getProfile = async (req, res) => {
  const user = await authService.getProfile(req.user._id.toString());
  return ApiResponse.ok(res, "Profile fetched successfully", { user });
};

const logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return ApiResponse.ok(res, "Logged out successfully", null);
};

const googleCallback = async (req, res) => {
  const { accessToken, refreshToken, user } = req.user;

  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  return res.redirect(
    `${env.CLIENT_URL}/auth/google/success?token=${accessToken}`
  );
};

export const authController = {
  register,
  login,
  getProfile,
  logout,
  googleCallback,
};