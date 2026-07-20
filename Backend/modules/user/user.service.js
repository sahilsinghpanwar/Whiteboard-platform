import * as userRepo from './user.repository.js';
import { ApiError } from '../../core/utils/ApiError.js';


//  Profile 
export const getMyProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const { password, refreshToken, googleId, __v, ...publicUser } = user;
  return publicUser;
};


export const getUserProfile = async (targetUserId) => {
  const user = await userRepo.findById(targetUserId);
  if (!user || !user.isActive) throw ApiError.notFound('User not found');

  return {
    _id:             user._id,
    fullName:        user.fullName,
    profileImageUrl: user.profileImageUrl,
    bio:             user.bio,
    createdAt:       user.createdAt,
  };
};


export const updateProfile = async (userId, updates) => {
  const allowedFields = ['fullName', 'bio', 'profileImageUrl'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(filtered).length === 0) {
    throw ApiError.badRequest('No valid fields provided for update');
  }

  const updated = await userRepo.updateProfile(userId, filtered);
  if (!updated) throw ApiError.notFound('User not found');

  return updated;
};


export const changePassword = async (userId, { currentPassword, newPassword }) => {
  // Fetch user WITH password (normally excluded by select: false)
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User not found');

  // Google-only users have no password set
  if (!user.password) {
    throw ApiError.badRequest(
      'Your account uses Google sign-in and does not have a password. ' +
      'Use Google to log in.'
    );
  }

  // Verify current password
  const { default: bcrypt } = await import('bcryptjs');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // updatePassword in repo triggers the pre-save hook which hashes the new password
  await userRepo.updatePassword(userId, newPassword);
};

// Search 
export const searchUsers = async (query, requestingUserId) => {
  if (!query || query.trim().length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }
  return userRepo.searchByName(query.trim(), requestingUserId);
};

// Account Management 

export const deactivateAccount = async (userId, password) => {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.password) {
    if (!password) {
      throw ApiError.badRequest('Password confirmation is required to deactivate your account');
    }
    const { default: bcrypt } = await import('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw ApiError.unauthorized('Incorrect password');
  }

  await userRepo.deactivateUser(userId);
};
