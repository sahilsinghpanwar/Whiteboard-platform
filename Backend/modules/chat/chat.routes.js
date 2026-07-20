import { Router } from 'express';
import * as controller from './chat.controller.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';


const router = Router({ mergeParams: true }); 

router.use(authenticate);

router.get(  '/', asyncHandler(controller.getMessageHistory));
router.delete('/:messageId', asyncHandler(controller.deleteMessage));

export default router;
