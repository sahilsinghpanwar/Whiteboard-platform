import { z } from 'zod';


export const updateProfileSchema = z
  .object({
    fullName:        z.string().min(1).max(100).trim().optional(),
    bio:             z.string().max(200).trim().optional(),
    profileImageUrl: z.string().url('Must be a valid URL').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });


export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8,  'Password must be at least 8 characters')
      .max(64, 'Password cannot exceed 64 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message:  'Passwords do not match',
    path:     ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message:  'New password must be different from current password',
    path:     ['newPassword'],
  });


export const searchUsersSchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(50)
    .trim(),
});



export const userIdParamSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});
