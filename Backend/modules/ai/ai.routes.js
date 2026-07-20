import { Router } from 'express';
import * as controller from './ai.controller.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';
import { validate }      from '../../core/middleware/validation.middleware.js';
import { z }             from 'zod';

// Mounted under /api/v1/boards/:boardId/ai — mergeParams gives us :boardId
const router = Router({ mergeParams: true });

router.use(authenticate);

// Inline Zod schemas (lightweight — no need for a separate validation file for AI)
const brainstormSchema   = z.object({ topic: z.string().min(1).max(200) });
const diagramSchema      = z.object({ description: z.string().min(1).max(500) });
const improveSchema      = z.object({
  selectedElements: z.array(z.record(z.unknown())).min(1),
  instruction:      z.string().max(200).optional(),
});

router.post('/brainstorm', validate({ body: brainstormSchema }),  asyncHandler(controller.brainstorm));
router.post('/diagram',    validate({ body: diagramSchema }),     asyncHandler(controller.generateDiagram));
router.post('/summary',                                           asyncHandler(controller.summariseBoard));
router.post('/improve',    validate({ body: improveSchema }),     asyncHandler(controller.improveText));

export default router;
