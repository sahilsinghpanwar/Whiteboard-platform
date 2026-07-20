import * as chatService from './chat.service.js';
import { logger } from '../../core/logger/logger.js';

export const registerChatHandlers = (io) => {
  const chat = io.of('/chat');

  chat.on('connection', (socket) => {
    const { user } = socket;
    logger.info('Chat socket connected', { userId: user._id });

    //  chat:join 
    socket.on('chat:join', async ({ boardId }) => {
      if (!boardId) return socket.emit('error', { message: 'boardId is required' });

      try {
        // Validate board access before joining the room
        const { default: boardModel } = await import('../board/board.model.js');
        const board = await boardModel.findById(boardId).lean();
        if (!board) return socket.emit('error', { message: 'Board not found' });

        await socket.join(`board:${boardId}`);
        socket.emit('chat:joined', { boardId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    //  chat:send 
    socket.on('chat:send', async ({ boardId, content, type = 'text', imageUrl }) => {
      try {
        if (!boardId) return;

        const message = await chatService.sendMessage(boardId, user._id, {
          content,
          type,
          imageUrl,
        });

        // Emit to everyone in the room including the sender
        io.of('/chat').to(`board:${boardId}`).emit('chat:message', message);
      } catch (err) {
        socket.emit('error', { message: err.message });
        logger.error('chat:send error', { error: err.message, userId: user._id });
      }
    });

    // chat:typing 
    // High-frequency — broadcast only, never persisted
    socket.on('chat:typing', ({ boardId }) => {
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('chat:typing', {
        userId:   user._id,
        fullName: user.fullName,
      });
    });

    socket.on('chat:stop-typing', ({ boardId }) => {
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('chat:stop-typing', { userId: user._id });
    });

    //  chat:delete 
    socket.on('chat:delete', async ({ boardId, messageId }) => {
      try {
        await chatService.deleteMessage(messageId, user._id);
        io.of('/chat').to(`board:${boardId}`).emit('chat:deleted', { messageId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Chat socket disconnected', { userId: user._id });
    });
  });
};
