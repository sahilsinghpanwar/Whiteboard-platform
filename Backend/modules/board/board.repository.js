import Board from './board.model.js';

export const findById = (boardId, fields = '') =>{ 
    Board.findById(boardId, fields).lean();
}


export const findByIdWithMembers = (boardId) => {
    Board.findById(boardId)
    .populate('owner', 'fullName email profileImageUrl')
    .populate('member.userId', 'fullName email profileImageUrl')
    .lean();
}


export const findByOwner = (userId) => {
  Board.find({ owner: userId }, '-canvas.elements')
    .sort({ lastActivityAt: -1 })
    .lean();
}


export const findByMember = (userId) => {
  Board.find({ 'members.userId': userId }, '-canvas.elements')
    .sort({ lastActivityAt: -1 })
    .lean();
}


export const findDashboardBoards = async (userId) => {
  const [owned, joined] = await Promise.all([
    findByOwner(userId),
    findByMember(userId),
  ]);
  return { owned, joined };
};


export const existsByTitleAndOwner = (title, ownerId) =>
  Board.exists({ title, owner: ownerId });

// Write Operations
export const createBoard = (data) => Board.create(data);


/**
  Update board metadata (title, description, isPublic, thumbnail).
  Never used to update canvas — that has its own method.
 */
export const updateBoard = (boardId, updates) =>
  Board.findByIdAndUpdate(boardId, { $set: updates }, { new: true, runValidators: true }).lean();



/*
  Atomically update the entire canvas state.
  Called by the collaboration socket after debouncing client updates.
  Also bumps lastActivityAt so the dashboard sorts correctly.
 */
export const updateCanvas = (boardId, canvas) =>
  Board.findByIdAndUpdate(
    boardId,
    { $set: { canvas, lastActivityAt: new Date() } },
    { new: true }
  ).lean();


  /*
  Add or update a single element on the canvas without rewriting the whole state.
  Uses positional operator — efficient for real-time single-element edits.
  If element.id already exists, replaces it; if not, pushes it.
 */


  export const upsertElement = async (boardId, element) => {
  const existing = await Board.exists({
    _id: boardId,
    'canvas.elements.id': element.id,
  });
 
  if (existing) {
    return Board.findOneAndUpdate(
      { _id: boardId, 'canvas.elements.id': element.id },
      {
        $set: {
          'canvas.elements.$': element,
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    ).lean();
  }
 
  return Board.findByIdAndUpdate(
    boardId,
    {
      $push: { 'canvas.elements': element },
      $set: { lastActivityAt: new Date() },
    },
    { new: true }
  ).lean();
};


/**
  Remove one or more elements by their client-side IDs.
 */
export const deleteElements = (boardId, elementIds) =>
  Board.findByIdAndUpdate(
    boardId,
    {
      $pull: { 'canvas.elements': { id: { $in: elementIds } } },
      $set: { lastActivityAt: new Date() },
    },
    { new: true }
  ).lean();


  /**
  Add a member to the board.
  Prevents duplicates via $addToSet (won't add if userId already in members).
 */
export const addMember = (boardId, userId, role = 'editor') =>
  Board.findByIdAndUpdate(
    boardId,
    { $addToSet: { members: { userId, role, joinedAt: new Date() } } },
    { new: true }
  ).lean();



  /**
  Update an existing member's role.
 */

  export const updateMemberRole = (boardId, userId, role) =>
  Board.findOneAndUpdate(
    { _id: boardId, 'members.userId': userId },
    { $set: { 'members.$.role': role } },
    { new: true }
  ).lean();


  /**
 * Remove a member from the board.
 */
export const removeMember = (boardId, userId) =>
  Board.findByIdAndUpdate(
    boardId,
    { $pull: { members: { userId } } },
    { new: true }
  ).lean();

  
/**
  Permanently delete a board and all its data.
  Only the owner can do this — enforced in the service layer.
 */
export const deleteBoard = (boardId) =>
  Board.findByIdAndDelete(boardId);
 



/**
  Update the board thumbnail URL (called after export/snapshot).
 */
export const updateThumbnail = (boardId, thumbnailUrl) =>
  Board.findByIdAndUpdate(boardId, { $set: { thumbnail: thumbnailUrl } }).lean();
 