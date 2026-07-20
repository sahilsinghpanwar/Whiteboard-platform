import ChatMessage from './chat.model.js';

export const findMessagesByBoard = (boardId, { limit = 50, before } = {}) => {
  const query = { boardId };
  if (before) query.createdAt = { $lt: before };

  return ChatMessage
    .find(query)
    .sort({ createdAt: -1 }) 
    .limit(limit)
    .populate('sender', 'fullName profileImageUrl')
    .lean()
    .then((msgs) => msgs.reverse()); 
};

export const createMessage = async (data) => {
  const message = await ChatMessage.create(data);
  return ChatMessage.findById(message._id)
    .populate('sender', 'fullName profileImageUrl')
    .lean();
};

export const deleteMessagesByBoard = (boardId) =>
  ChatMessage.deleteMany({ boardId });


export const deleteMessage = (messageId) =>
  ChatMessage.findByIdAndDelete(messageId);
