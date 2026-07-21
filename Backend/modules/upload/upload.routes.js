import { Router } from 'express';
import * as controller from './upload.controller.js';
import { uploadMiddleware } from './upload.service.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// Board Asset Uploads (supports /board-asset, /board-image, /board-image/:boardId)
router.post(
  ['/board-asset', '/board-image', '/board-image/:boardId'],
  uploadMiddleware.single('image'),
  asyncHandler(controller.uploadBoardAsset)
);

// User Profile Avatar Uploads (supports /avatar, /profile-image)
router.post(
  ['/avatar', '/profile-image'],
  uploadMiddleware.single('avatar'),
  asyncHandler(controller.uploadAvatar)
);

export default router;
