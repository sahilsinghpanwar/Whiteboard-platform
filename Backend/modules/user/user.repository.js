import User from '../auth/auth.model.js';

//  Read Operations 
export const findById = (userId, fields = '-password') =>
  User.findById(userId, fields).lean();

export const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase() }).lean();

export const findByGoogleId = (googleId) =>
  User.findOne({ googleId }).lean();


//  Write Operations
export const updateUser = (userId, updates) =>
  User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true })
    .select('-password')
    .lean();

export const deleteUser = (userId) =>
  User.findByIdAndDelete(userId);
