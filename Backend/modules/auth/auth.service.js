import { authRepository } from "./auth.repository.js";
import { hashPassword, comparePassword } from "../../core/utils/password.js";
import { signAccessToken, signRefreshToken } from "../../core/utils/jwt.js";
import ApiError from "../../core/utils/ApiError.js";

const buildAuthPayload = (user) => {
  const userJson = user?.toPublicJSON ? user.toPublicJSON() : user;
  return {
    accessToken: signAccessToken(user._id.toString()),
    refreshToken: signRefreshToken(user._id.toString()),
    user: userJson,
  };
};

const registerWithEmailPassword = async ({ fullName, email, password, profileImageUrl }) => {
  const existingUser = await authRepository.findByEmail(email);

  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await authRepository.createUser({
    fullName,
    email,
    password: hashedPassword,
    profileImageUrl: profileImageUrl || null,
    authProvider: "local",
    isEmailVerified: false,
  });

  return buildAuthPayload(user);
};

const loginWithEmailPassword = async ({ email, password }) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const provider = user.authProvider || (user.googleId ? "google" : "local");

  if (provider !== "local") {
    throw ApiError.badRequest(
      `This account uses ${provider} sign-in. Please use that method.`
    );
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  return buildAuthPayload(user);
};

const loginOrRegisterWithGoogle = async ({ googleId, email, fullName, profileImageUrl }) => {

   // Case 1: Returning Google user
  const existingGoogleUser = await authRepository.findByGoogleId(googleId);
  if (existingGoogleUser) {
    return buildAuthPayload(existingGoogleUser);
  }

   // Case 2: User registered with email/password first, now linking Google
  const existingLocalUser = await authRepository.findByEmail(email);
  if (existingLocalUser) {
    const updatedUser = await authRepository.updateById(existingLocalUser._id, {
      googleId,
      authProvider: "google",
      isEmailVerified: true,
      profileImageUrl: existingLocalUser.profileImageUrl || profileImageUrl,
    });
    return buildAuthPayload(updatedUser);
  }

  // Case 3: Brand new user via Google
  const newUser = await authRepository.createUser({
    fullName,
    email,
    googleId,
    profileImageUrl,
    authProvider: "google",
    isEmailVerified: true,
  });

  return buildAuthPayload(newUser);
};


const getProfile = async (userId) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw ApiError.notFound("User");
  }

  return user;
};

export const authService = {
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginOrRegisterWithGoogle,
  getProfile,
};