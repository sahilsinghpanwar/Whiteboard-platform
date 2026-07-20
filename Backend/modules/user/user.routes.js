import { Router } from 'express';
import * as controller from './user.controller.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  searchUsersSchema,
  userIdParamSchema,
} from './user.validation.js';
import { authenticate }  from '../../core/middleware/auth.middleware.js';
import { validate }      from '../../core/middleware/validation.middleware.js';
import { asyncHandler }  from '../../core/utils/asyncHandler.js';

const router = Router();

router.use(authenticate);


router
  .route('/me')
  .get(asyncHandler(controller.getMyProfile))
  .put(
    validate({ body: updateProfileSchema }),
    asyncHandler(controller.updateProfile)
  )
  .delete(asyncHandler(controller.deactivateAccount));

router.post(
  '/me/change-password',
  validate({ body: changePasswordSchema }),
  asyncHandler(controller.changePassword)
);


router.get(
  '/search',
  validate({ query: searchUsersSchema }),
  asyncHandler(controller.searchUsers)
);


router.get(
  '/:userId',
  validate({ params: userIdParamSchema }),
  asyncHandler(controller.getUserProfile)
);

export default router;
