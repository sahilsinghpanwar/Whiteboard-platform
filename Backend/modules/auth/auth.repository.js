import User from "./auth.model.js";

const findByEmail = async (email) => {
  return User.findOne({ email }).select("+password");
};

const findById = async (userId) => {
  return User.findById(userId);
};

const findByGoogleId = async (googleId) => {
  return User.findOne({ googleId });
};

const createUser = async (userData) => {
  return User.create(userData);
};

const updateById = async (userId, updateData) => {
  return User.findByIdAndUpdate(userId, updateData, {
    new: true,           
    runValidators: true,
  });
};

export const authRepository = {
  findByEmail,
  findById,
  findByGoogleId,
  createUser,
  updateById,
};