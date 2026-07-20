import { z } from 'zod';

// Reusable primitives 

const mongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const memberRole = z.enum(['editor', 'viewer']);

//  Board CRUD 
export const createBoardSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters')
    .trim(),
  description: z.string().max(500).trim().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateBoardSchema = z.object({
  title:       z.string().min(1).max(120).trim().optional(),
  description: z.string().max(500).trim().optional(),
  isPublic:    z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

//  Member Management 

export const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address'),
  role: memberRole.default('editor'),
});

export const updateMemberRoleSchema = z.object({
  role: memberRole,
});

// Canvas

// Element coming from the client (minimal validation — full structure lives
// in board.types.js and is trusted after socket auth)
const elementSchema = z.object({
  id:       z.string().min(1, 'Element id is required'),
  type:     z.string().min(1, 'Element type is required'),
  x:        z.number(),
  y:        z.number(),
  width:    z.number().optional(),
  height:   z.number().optional(),
  rotation: z.number().optional().default(0),
  zIndex:   z.number().optional().default(0),
  data:     z.record(z.unknown()).optional().default({}),
});

export const upsertElementSchema = z.object({
  element: elementSchema,
});

export const deleteElementsSchema = z.object({
  elementIds: z
    .array(z.string().min(1))
    .min(1, 'At least one element ID is required'),
});

export const updateCanvasSchema = z.object({
  canvas: z.object({
    elements:   z.array(elementSchema).optional(),
    background: z.string().optional(),
    viewport: z
      .object({
        x:    z.number(),
        y:    z.number(),
        zoom: z.number().min(0.1).max(10),
      })
      .optional(),
  }),
});

//  Param schemas (for route :boardId, :memberId) 

export const boardIdParamSchema = z.object({
  boardId: mongoId,
});

export const memberIdParamSchema = z.object({
  boardId:  mongoId,
  memberId: mongoId,
});
