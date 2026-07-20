import { verifyAccessToken } from "../utils/jwt.js";
import { authRepository } from "../../modules/auth/auth.repository.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";


const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw ApiError.unauthorized("No access token provided. Please log in.");
  }

  const decoded = verifyAccessToken(token);

  const user = await authRepository.findById(decoded.userId);

  if (!user) {
    throw ApiError.unauthorized("The account associated with this token no longer exists.");
  }

  req.user = user;
  next();
});

export default protect;