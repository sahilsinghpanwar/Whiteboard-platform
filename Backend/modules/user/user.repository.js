import User from './user.model.js';


//  Read 
export const findById = (userId) =>
  User.findById(userId).lean();

export const findByIdWithPassword = (userId) =>
  User.findById(userId).select('+password').lean();

export const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase().trim() }).lean();

export const findByEmailWithPassword = (email) =>
  User.findOne({ email: email.toLowerCase().trim() }).select('+password').lean();

export const findByGoogleId = (googleId) =>
  User.findOne({ googleId }).lean();

export const findByIdWithRefreshToken = (userId) =>
  User.findById(userId).select('+refreshToken').lean();

export const searchByName = (query, excludeUserId) =>
  User.find(
    {
      $text: { $search: query },
      _id:   { $ne: excludeUserId },
      isActive: true,
    },
    { score: { $meta: 'textScore' }, password: 0, refreshToken: 0, googleId: 0 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();

export const existsByEmail = (email) =>
  User.exists({ email: email.toLowerCase().trim() });


export const createUser = (data) => User.create(data);


export const updateProfile = (userId, updates) =>
  User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .select('-password -refreshToken -googleId')
    .lean();

export const updateRefreshToken = (userId, hashedToken) =>
  User.findByIdAndUpdate(userId, { $set: { refreshToken: hashedToken } });

export const clearRefreshToken = (userId) =>
  User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });

export const updateLastSeen = (userId) =>
  User.findByIdAndUpdate(userId, { $set: { lastSeenAt: new Date() } });

export const linkGoogleAccount = (userId, googleId, profileImageUrl) =>
  User.findByIdAndUpdate(
    userId,
    {
      $set: {
        googleId,
        isEmailVerified: true,
        ...(profileImageUrl && { profileImageUrl }),
      },
    },
    { new: true }
  ).lean();

export const markEmailVerified = (userId) =>
  User.findByIdAndUpdate(userId, { $set: { isEmailVerified: true } });

export const deactivateUser = (userId) =>
  User.findByIdAndUpdate(userId, { $set: { isActive: false, refreshToken: null } });

export const deleteUser = (userId) =>
  User.findByIdAndDelete(userId);

export const updatePassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) return null;
  user.password = newPassword; 
  return user.save();
};