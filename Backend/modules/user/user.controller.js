import * as userService from './user.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';

export const getMyProfile = async (req, res) => {
  const user = await userService.getMyProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
};

export const getUserProfile = async (req, res) => {
  const user = await userService.getUserProfile(req.params.userId);
  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
};

export const updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
};

export const changePassword = async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
};

export const searchUsers = async (req, res) => {
  const users = await userService.searchUsers(req.query.q, req.user._id);
  res.status(200).json(new ApiResponse(200, users, 'Users found'));
};

export const deactivateAccount = async (req, res) => {
  await userService.deactivateAccount(req.user._id, req.body.password);
  res.clearCookie('refreshToken');
  res.status(200).json(new ApiResponse(200, null, 'Account deactivated successfully'));
};
