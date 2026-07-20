import { Router } from 'express';
import * as controller from './upload.controller.js';
import { uploadMiddleware } from './upload.service.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';

const router = Router();
router.use(authenticate);


router.post(
  '/board-asset',
  uploadMiddleware.single('image'),
  asyncHandler(controller.uploadBoardAsset)
);

router.post(
  '/avatar',
  uploadMiddleware.single('avatar'),
  asyncHandler(controller.uploadAvatar)
);

export default router;
