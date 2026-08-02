import { Router } from 'express';
import * as controller from './ai.controller.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';
import { validate }      from '../../core/middleware/validation.middleware.js';
import { z }             from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

const agentSchema = z.object({
  prompt: z.string().min(1).max(2000),
  selectedElementIds: z.array(z.string()).optional(),
  conversationHistory: z.array(z.record(z.unknown())).optional(),
});

const visionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  image: z.string().min(1), // base64 string
  selectedElementIds: z.array(z.string()).optional(),
});

const brainstormSchema = z.object({ topic: z.string().min(1).max(200) });
const diagramSchema    = z.object({ description: z.string().min(1).max(500) });
const improveSchema    = z.object({
  selectedElements: z.array(z.record(z.unknown())).min(1),
  instruction:      z.string().max(200).optional(),
});

router.post('/agent',      validate({ body: agentSchema }),       asyncHandler(controller.processAgentRequest));
router.post('/vision',     validate({ body: visionSchema }),      asyncHandler(controller.processVisionRequest));
router.post('/brainstorm', validate({ body: brainstormSchema }),  asyncHandler(controller.brainstorm));
router.post('/diagram',    validate({ body: diagramSchema }),     asyncHandler(controller.generateDiagram));
router.route('/summary')
  .get(asyncHandler(controller.summariseBoard))
  .post(asyncHandler(controller.summariseBoard));
router.post('/improve',    validate({ body: improveSchema }),     asyncHandler(controller.improveText));

export default router;
