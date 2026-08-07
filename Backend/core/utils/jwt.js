import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import ApiError from "./ApiError.js";

export const signAccessToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

export const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw ApiError.unauthorized("Access token is invalid or expired");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw ApiError.unauthorized("Refresh token is invalid or expired. Please log in again.");
  }
};

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});