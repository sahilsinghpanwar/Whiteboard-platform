import * as chatRepo from './chat.repository.js';
import { boardService } from '../board/index.js';
import { ApiError } from '../../core/utils/ApiError.js';


const assertBoardAccess = async (boardId, userId) => {
  // getBoardById already throws if no access
  return boardService.getBoardById(boardId, userId);
};

//  Message History 
export const getMessageHistory = async (boardId, userId, { limit = 50, before } = {}) => {
  await assertBoardAccess(boardId, userId);

  const beforeDate = before ? new Date(before) : undefined;
  if (before && isNaN(beforeDate)) {
    throw ApiError.badRequest('`before` must be a valid ISO date string');
  }

  return chatRepo.findMessagesByBoard(boardId, { limit: Math.min(limit, 100), before: beforeDate });
};

// Send Message 
export const sendMessage = async (boardId, senderId, { content, type = 'text', imageUrl }) => {
  await assertBoardAccess(boardId, senderId);

  if (type === 'text' && (!content || content.trim() === '')) {
    throw ApiError.badRequest('Message content cannot be empty');
  }

  return chatRepo.createMessage({
    boardId,
    sender: senderId,
    type,
    content: content?.trim(),
    imageUrl,
  });
};

//  Delete Message 

export const deleteMessage = async (messageId, userId) => {
  const { default: ChatMessage } = await import('./chat.model.js');
  const message = await ChatMessage.findById(messageId);

  if (!message) throw ApiError.notFound('Message not found');
  if (message.sender.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own messages');
  }

  await chatRepo.deleteMessage(messageId);
};
