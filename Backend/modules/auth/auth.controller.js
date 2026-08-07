import { authService } from "./auth.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import { getRefreshTokenCookieOptions, verifyRefreshToken, signAccessToken } from "../../core/utils/jwt.js";
import { env } from "../../core/config/env.js";

const sendAuthResponse = (res, statusCode, message, authPayload) => {
  const { accessToken, refreshToken, user } = authPayload;

  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  const userJson = user?.toPublicJSON ? user.toPublicJSON() : user;

  return res.status(statusCode).json(
    new ApiResponse(statusCode, message, { accessToken, user: userJson })
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

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json(new ApiResponse(401, "No refresh token provided"));
  }
  const decoded = verifyRefreshToken(refreshToken);
  const user = await authService.getProfile(decoded.userId);
  const accessToken = signAccessToken(user._id.toString());
  const userJson = user?.toPublicJSON ? user.toPublicJSON() : user;
  return res.status(200).json(
    new ApiResponse(200, "Token refreshed successfully", { accessToken, user: userJson })
  );
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
  refresh,
  logout,
  googleCallback,
};