import { Router } from 'express';
import * as controller from './export.controller.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';
import { validate }      from '../../core/middleware/validation.middleware.js';
import { z }             from 'zod';

const router = Router({ mergeParams: true });
router.use(authenticate);

const exportSchema = z.object({
  type:        z.enum(['json', 'png', 'pdf']),
  base64Image: z.string().optional(),
});

router.post('/', validate({ body: exportSchema }), asyncHandler(controller.exportBoard));

export default router;
