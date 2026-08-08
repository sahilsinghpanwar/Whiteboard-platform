import * as boardRepo from './board.repository.js';
import * as userRepo from '../user/user.repository.js';
import { ApiError } from '../../core/utils/ApiError.js';
import { invalidatePermissionCache } from '../collaboration/collaboration.service.js';

const toIdStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  
  let idVal = val;
  if (val._id) {
    idVal = val._id;
  } else if (val.id && typeof val.id === 'string') {
    idVal = val.id;
  } else if (val.userId) {
    idVal = val.userId;
  } else if (val.user) {
    idVal = val.user;
  }

  if (typeof idVal === 'string') return idVal;
  
  if (idVal && typeof idVal.toString === 'function') {
    const str = idVal.toString();
    if (str && str !== '[object Object]') return str;
  }
  
  return String(idVal);
};

const getBoardOrThrow = async (boardId, fields) => {
  const board = await boardRepo.findById(boardId, fields);
  if (!board) throw ApiError.notFound('Board not found');
  return board;
};

const assertPermission = (board, userId, minimumRole = 'viewer') => {
  const id = toIdStr(userId);
  const ownerStr = toIdStr(board.owner);

  if (ownerStr && id && ownerStr === id) return; // owner always passes

  const member = board.members?.find((m) => {
    const mId = toIdStr(m.userId || m.user || m);
    return mId === id;
  });

  if (!member) {
    throw ApiError.forbidden('You do not have access to this board');
  }

  if (member.status === 'pending') {
    throw ApiError.forbidden('You must accept the invitation to access this board');
  }

  const hierarchy = { viewer: 0, editor: 1, owner: 2 };
  if (hierarchy[member.role] < hierarchy[minimumRole]) {
    throw ApiError.forbidden(
      `This action requires '${minimumRole}' permission or higher`
    );
  }
};

// Board CRUD


export const createBoard = async (userId, { title, description, isPublic }) => {
  const board = await boardRepo.createBoard({
    title,
    description,
    isPublic,
    owner: userId,
    members: [],
    canvas: { elements: [], background: '#ffffff', viewport: { x: 0, y: 0, zoom: 1 } },
  });
  return boardRepo.findByIdWithMembers(board._id);
};


export const getDashboardBoards = (userId) =>
  boardRepo.findDashboardBoards(userId);


export const getBoardById = async (boardId, userId) => {
  const board = await boardRepo.findByIdWithMembers(boardId);
  if (!board) throw ApiError.notFound('Board not found');

  if (!board.isPublic) {
    assertPermission(board, userId, 'viewer');
  }

  return board;
};


export const updateBoard = async (boardId, userId, updates) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');

  await boardRepo.updateBoard(boardId, updates);
  return boardRepo.findByIdWithMembers(boardId);
};


export const deleteBoard = async (boardId, userId) => {
  const board = await getBoardOrThrow(boardId);

  if (toIdStr(board.owner) !== toIdStr(userId)) {
    throw ApiError.forbidden('Only the board owner can delete this board');
  }

  await boardRepo.deleteBoard(boardId);
};


export const inviteMember = async (boardId, requesterId, { email, role }) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, requesterId, 'editor');

  // Find the user being invited
  const invitee = await userRepo.findByEmail(email);
  if (!invitee) {
    throw ApiError.notFound(`User with email '${email}' is not registered yet. Please have them sign up first.`);
  }

  const inviteeIdStr = toIdStr(invitee._id);
  const ownerStr = toIdStr(board.owner);

  // Can't invite the owner — they're already the owner
  if (inviteeIdStr === ownerStr) {
    throw ApiError.conflict('This user is already the board owner');
  }

  // If already a member, update their role instead of throwing conflict error
  const alreadyMember = board.members?.some(
    (m) => toIdStr(m.userId) === inviteeIdStr
  );
  if (alreadyMember) {
    await boardRepo.updateMemberRole(boardId, invitee._id, role);
    invalidatePermissionCache(boardId);
    return boardRepo.findByIdWithMembers(boardId);
  }

  await boardRepo.addMember(boardId, invitee._id, role);
  invalidatePermissionCache(boardId);
  return boardRepo.findByIdWithMembers(boardId);
};


//  Change a member's role. Only the owner can promote/demote.
 
export const updateMemberRole = async (boardId, requesterId, memberId, role) => {
  const board = await getBoardOrThrow(boardId);

  if (toIdStr(board.owner) !== toIdStr(requesterId)) {
    throw ApiError.forbidden(`Only the board owner can change member roles. owner=${toIdStr(board.owner)}, requester=${toIdStr(requesterId)}`);
  }

  const isMember = board.members?.some((m) => toIdStr(m.userId) === toIdStr(memberId));
  if (!isMember) {
    throw ApiError.notFound('Member not found on this board');
  }

  await boardRepo.updateMemberRole(boardId, memberId, role);
  invalidatePermissionCache(boardId);
  return boardRepo.findByIdWithMembers(boardId);
};


//  Accept a board invitation

export const acceptInvitation = async (boardId, userId) => {
  const board = await getBoardOrThrow(boardId);
  const member = board.members?.find((m) => toIdStr(m.userId) === toIdStr(userId));
  
  if (!member) {
    throw ApiError.notFound('You are not invited to this board');
  }
  
  if (member.status === 'accepted') {
    return board;
  }
  
  await boardRepo.updateMemberStatus(boardId, userId, 'accepted');
  invalidatePermissionCache(boardId);
  return boardRepo.findByIdWithMembers(boardId);
};


  // Decline a board invitation

export const declineInvitation = async (boardId, userId) => {
  const board = await getBoardOrThrow(boardId);
  const member = board.members?.find((m) => toIdStr(m.userId) === toIdStr(userId));
  
  if (!member) {
    throw ApiError.notFound('You are not invited to this board');
  }
  
  await boardRepo.removeMember(boardId, userId);
  invalidatePermissionCache(boardId);
  return { message: 'Invitation declined' };
};


  // Remove a member. Owner can remove anyone; a member can remove themselves.
 
export const removeMember = async (boardId, requesterId, targetUserId) => {
  const board = await getBoardOrThrow(boardId);
  const isOwner = toIdStr(board.owner) === toIdStr(requesterId);
  const isSelf  = toIdStr(requesterId) === toIdStr(targetUserId);

  if (!isOwner && !isSelf) {
    throw ApiError.forbidden('You do not have permission to remove this member');
  }

  // Owner cannot remove themselves — they must delete the board instead
  if (isOwner && isSelf) {
    throw ApiError.badRequest(
      'Board owners cannot leave their own board. Delete the board instead.'
    );
  }

  await boardRepo.removeMember(boardId, targetUserId);
  invalidatePermissionCache(boardId);
  return boardRepo.findByIdWithMembers(boardId);
};

// Canvas Operations
export const saveCanvas = async (boardId, userId, canvas) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');
  return boardRepo.updateCanvas(boardId, canvas);
};

export const upsertElement = async (boardId, userId, element) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');

  const enriched = {
    ...element,
    updatedBy: userId,
    createdBy: element.createdBy ?? userId,
  };

  return boardRepo.upsertElement(boardId, enriched);
};


  // Delete elements by ID array.
 
export const deleteElements = async (boardId, userId, elementIds) => {
  const board = await getBoardOrThrow(boardId);
  assertPermission(board, userId, 'editor');
  return boardRepo.deleteElements(boardId, elementIds);
};

