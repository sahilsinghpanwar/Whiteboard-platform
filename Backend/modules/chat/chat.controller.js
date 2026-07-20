import * as chatService from './chat.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';

export const getMessageHistory = async (req, res) => {
  const { boardId } = req.params;
  const { limit, before } = req.query;

  const messages = await chatService.getMessageHistory(boardId, req.user._id, {
    limit: limit ? parseInt(limit, 10) : 50,
    before,
  });

  res.status(200).json(
    new ApiResponse(200, messages, 'Messages fetched successfully')
  );
};

export const deleteMessage = async (req, res) => {
  await chatService.deleteMessage(req.params.messageId, req.user._id);
  res.status(200).json(
    new ApiResponse(200, null, 'Message deleted successfully')
  );
};
