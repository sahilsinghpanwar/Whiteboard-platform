import * as boardRepo from './board.repository.js';
import * as userRepo from '../user/user.repository.js';
import { ApiError } from '../../core/utils/ApiError.js';

const getBoardOrThrow = async (boardId, fields) => {
  const board = await boardRepo.findById(boardId, fields);
  if (!board) throw ApiError.notFound('Board not found');
  return board;
};

const assertPermission = (board, userId, minimumRole = 'viewer') => {
  const id = userId.toString();
  const ownerStr = board.owner.toString?.() ?? board.owner;

  if (ownerStr === id) return; // owner always passes

  const member = board.members?.find((m) => {
    const mId = m.userId.toString?.() ?? m.userId;
    return mId === id;
  });

  if (!member) {
    throw ApiError.forbidden('You do not have access to this board');
  }

  const hierarchy = { viewer: 0, editor: 1, owner: 2 };
  if (hierarchy[member.role] < hierarchy[minimumRole]) {
    throw ApiError.forbidden(
      `This action requires '${minimumRole}' permission or higher`
    );
  }
};

// Board CRUD


//   Create a new board owned by the requesting user.
 
export const createBoard = async (userId, { title, description, isPublic }) => {
  const board = await boardRepo.createBoard({
    title,
    description,
    isPublic,
    owner: userId,
    members: [],
    canvas: { elements: [], background: '#ffffff', viewport: { x: 0, y: 0, zoom: 1 } },
  });
  return board;
};


//   Get all boards for the dashboard (owned + joined), without canvas data.
 
export const getDashboardBoards = (userId) =>
  boardRepo.findDashboardBoards(userId);


//   Get full board data (including canvas elements).
//   Accessible to: owner, members, and any user if board.isPublic.
 
export const getBoardById = async (boardId, userId) => {
  const board = await boardRepo.findByIdWithMembers(boardId);
  if (!board) throw ApiError.notFound('Board not found');

  if (!board.isPublic) {
    assertPermission(board, userId, 'viewer');
  }

  return board;
};


//   Update board metadata (title, description, isPublic).
//   Only owner and editors can update. Viewers cannot.
 
export const updateBoard = async (boardId, userId, updates) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');

  const updated = await boardRepo.updateBoard(boardId, updates);
  return updated;
};


//   Delete a board permanently. Only the owner can do this.
 
export const deleteBoard = async (boardId, userId) => {
  const board = await getBoardOrThrow(boardId);

  if (board.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the board owner can delete this board');
  }

  await boardRepo.deleteBoard(boardId);
};

// Member Management


//   Invite a user to the board by email.
//   Looks up the invitee by email
//   Checks they aren't already a member or the owner
//   Adds them with the specified role
 
export const inviteMember = async (boardId, requesterId, { email, role }) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, requesterId, 'editor');

  // Find the user being invited
  const invitee = await userRepo.findByEmail(email);
  if (!invitee) {
    throw ApiError.notFound(`User with email '${email}' is not registered yet. Please have them sign up first.`);
  }

  const inviteeIdStr = invitee._id.toString();
  const ownerStr = board.owner.toString();

  // Can't invite the owner — they're already the owner
  if (inviteeIdStr === ownerStr) {
    throw ApiError.conflict('This user is already the board owner');
  }

  // Can't add duplicate members
  const alreadyMember = board.members?.some(
    (m) => m.userId.toString() === inviteeIdStr
  );
  if (alreadyMember) {
    throw ApiError.conflict('This user is already a member of the board');
  }

  const updated = await boardRepo.addMember(boardId, invitee._id, role);
  return updated;
};


//   Change a member's role. Only the owner can promote/demote.
 
export const updateMemberRole = async (boardId, requesterId, memberId, role) => {
  const board = await getBoardOrThrow(boardId);

  if (board.owner.toString() !== requesterId.toString()) {
    throw ApiError.forbidden('Only the board owner can change member roles');
  }

  const isMember = board.members?.some((m) => m.userId.toString() === memberId);
  if (!isMember) {
    throw ApiError.notFound('Member not found on this board');
  }

  return boardRepo.updateMemberRole(boardId, memberId, role);
};


//   Remove a member. Owner can remove anyone; a member can remove themselves.
 
export const removeMember = async (boardId, requesterId, targetUserId) => {
  const board = await getBoardOrThrow(boardId);
  const isOwner = board.owner.toString() === requesterId.toString();
  const isSelf  = requesterId.toString() === targetUserId.toString();

  if (!isOwner && !isSelf) {
    throw ApiError.forbidden('You do not have permission to remove this member');
  }

  // Owner cannot remove themselves — they must delete the board instead
  if (isOwner && isSelf) {
    throw ApiError.badRequest(
      'Board owners cannot leave their own board. Delete the board instead.'
    );
  }

  return boardRepo.removeMember(boardId, targetUserId);
};

// Canvas Operations


//   Full canvas state save (called on disconnect or manual save).
//   Only editors and owners can write canvas.
 
export const saveCanvas = async (boardId, userId, canvas) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');
  return boardRepo.updateCanvas(boardId, canvas);
};


//   Upsert a single element (called per socket event for real-time edits).
//   Attaches the requesting user as createdBy / updatedBy.
 
export const upsertElement = async (boardId, userId, element) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');

  const enriched = {
    ...element,
    updatedBy: userId,
    // Only set createdBy if this is a new element (upsertElement handles the check)
    createdBy: element.createdBy ?? userId,
  };

  return boardRepo.upsertElement(boardId, enriched);
};


//   Delete elements by ID array.
 
export const deleteElements = async (boardId, userId, elementIds) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');
  return boardRepo.deleteElements(boardId, elementIds);
};
