import { Router } from 'express';
import * as controller from './board.controller.js';
import {
  createBoardSchema,
  updateBoardSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  boardIdParamSchema,
  memberIdParamSchema,
  updateCanvasSchema,
  upsertElementSchema,
  deleteElementsSchema,
} from './board.validation.js';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { validate } from '../../core/middleware/validation.middleware.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';

const router = Router();

// All board routes require authentication
router.use(authenticate);

router
  .route('/')
  .get(asyncHandler(controller.getDashboardBoards))
  .post(
    validate({ body: createBoardSchema }),
    asyncHandler(controller.createBoard)
  );

router
  .route('/:boardId')
  .get(
    validate({ params: boardIdParamSchema }),
    asyncHandler(controller.getBoardById)
  )
  .put(
    validate({ params: boardIdParamSchema, body: updateBoardSchema }),
    asyncHandler(controller.updateBoard)
  )
  .delete(
    validate({ params: boardIdParamSchema }),
    asyncHandler(controller.deleteBoard)
  );

router
  .route('/:boardId/members')
  .post(
    validate({ params: boardIdParamSchema, body: inviteMemberSchema }),
    asyncHandler(controller.inviteMember)
  );

router
  .route('/:boardId/members/accept')
  .post(
    validate({ params: boardIdParamSchema }),
    asyncHandler(controller.acceptInvitation)
  );

router
  .route('/:boardId/members/decline')
  .post(
    validate({ params: boardIdParamSchema }),
    asyncHandler(controller.declineInvitation)
  );

router
  .route('/:boardId/members/:memberId')
  .patch(
    validate({ params: memberIdParamSchema, body: updateMemberRoleSchema }),
    asyncHandler(controller.updateMemberRole)
  )
  .delete(
    validate({ params: memberIdParamSchema }),
    asyncHandler(controller.removeMember)
  );

router
  .route('/:boardId/canvas')
  .put(
    validate({ params: boardIdParamSchema, body: updateCanvasSchema }),
    asyncHandler(controller.saveCanvas)
  );

router
  .route('/:boardId/canvas/elements')
  .post(
    validate({ params: boardIdParamSchema, body: upsertElementSchema }),
    asyncHandler(controller.upsertElement)
  )
  .delete(
    validate({ params: boardIdParamSchema, body: deleteElementsSchema }),
    asyncHandler(controller.deleteElements)
  );

export default router;
