import Board from './board.model.js';

const inFlightPromises = new Map();

export const invalidateBoardCache = (boardId) => {
  if (boardId) {
    inFlightPromises.delete(boardId.toString());
  }
};

export const findById = (boardId, fields = '') =>
  Board.findById(boardId, fields).lean();

export const findByIdWithMembers = (boardId) => {
  const key = boardId ? boardId.toString() : '';
  if (!key) return Promise.resolve(null);

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = Board.findById(boardId)
    .populate('owner', 'fullName email profileImageUrl')
    .populate('members.userId', 'fullName email profileImageUrl')
    .lean()
    .finally(() => {
      // Clear after 2 seconds to keep data fresh while batching concurrent requests
      setTimeout(() => inFlightPromises.delete(key), 2000);
    });

  inFlightPromises.set(key, promise);
  return promise;
};

export const findByOwner = (userId) =>
  Board.find({ owner: userId }, '-canvas.elements')
    .populate('owner', 'fullName email profileImageUrl')
    .populate('members.userId', 'fullName email profileImageUrl')
    .sort({ lastActivityAt: -1 })
    .lean();

export const findByMember = (userId) =>
  Board.find({ 'members.userId': userId }, '-canvas.elements')
    .populate('owner', 'fullName email profileImageUrl')
    .populate('members.userId', 'fullName email profileImageUrl')
    .sort({ lastActivityAt: -1 })
    .lean();

export const findDashboardBoards = async (userId) => {
  const [owned, joined] = await Promise.all([
    findByOwner(userId),
    findByMember(userId),
  ]);
  return [...(owned || []), ...(joined || [])];
};

export const existsByTitleAndOwner = (title, ownerId) =>
  Board.exists({ title, owner: ownerId });

// Write Operations
export const createBoard = (data) => Board.create(data);

export const updateBoard = (boardId, updates) => {
  invalidateBoardCache(boardId);
  return Board.findByIdAndUpdate(boardId, { $set: updates }, { returnDocument: 'after', runValidators: true }).lean();
};

export const updateCanvas = (boardId, canvas) => {
  invalidateBoardCache(boardId);
  return Board.findByIdAndUpdate(
    boardId,
    { $set: { canvas, lastActivityAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();
};


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
      { returnDocument: 'after' }
    ).lean();
  }
 
  return Board.findByIdAndUpdate(
    boardId,
    {
      $push: { 'canvas.elements': element },
      $set: { lastActivityAt: new Date() },
    },
    { returnDocument: 'after' }
  ).lean();
};


export const deleteElements = (boardId, elementIds) =>
  Board.findByIdAndUpdate(
    boardId,
    {
      $pull: { 'canvas.elements': { id: { $in: elementIds } } },
      $set: { lastActivityAt: new Date() },
    },
    { returnDocument: 'after' }
  ).lean();


export const addMember = (boardId, userId, role = 'editor') =>
  Board.findByIdAndUpdate(
    boardId,
    { $addToSet: { members: { userId, role, status: 'pending', joinedAt: new Date() } } },
    { returnDocument: 'after' }
  ).lean();


export const updateMemberStatus = (boardId, userId, status) =>
  Board.findOneAndUpdate(
    { _id: boardId, 'members.userId': userId },
    { $set: { 'members.$.status': status } },
    { returnDocument: 'after' }
  ).lean();


export const updateMemberRole = (boardId, userId, role) =>
  Board.findOneAndUpdate(
    { _id: boardId, 'members.userId': userId },
    { $set: { 'members.$.role': role } },
    { returnDocument: 'after' }
  ).lean();


export const removeMember = (boardId, userId) =>
  Board.findByIdAndUpdate(
    boardId,
    { $pull: { members: { userId } } },
    { returnDocument: 'after' }
  ).lean();


export const deleteBoard = (boardId) =>
  Board.findByIdAndDelete(boardId);


export const updateThumbnail = (boardId, thumbnailUrl) =>
  Board.findByIdAndUpdate(boardId, { $set: { thumbnail: thumbnailUrl } }).lean();