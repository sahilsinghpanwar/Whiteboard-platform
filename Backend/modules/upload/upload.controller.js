import * as uploadService from './upload.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';

export const uploadBoardAsset = async (req, res) => {
  const boardId = req.params.boardId || req.query.boardId || req.query.id || req.body?.boardId || "general";
  const asset = await uploadService.uploadBoardAsset(req.file, boardId);
  res.status(201).json(
    new ApiResponse(201, asset, 'Asset uploaded successfully')
  );
};

export const uploadAvatar = async (req, res) => {
  const asset = await uploadService.uploadAvatar(req.file, req.user._id.toString());
  res.status(201).json(
    new ApiResponse(201, asset, 'Avatar uploaded successfully')
  );
};
