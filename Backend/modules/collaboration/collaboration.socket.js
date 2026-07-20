import * as collabService from './collaboration.service.js';
import { logger } from '../../core/logger/logger.js';


export const registerCollaborationHandlers = (io) => {

  // collaboration
  const collab = io.of('/collaboration');

  collab.on('connection', (socket) => {
    const { user } = socket; // attached by JWT middleware in socket.js
    logger.info('Collaboration socket connected', { userId: user._id });

    //  join-board 
    socket.on('join-board', async ({ boardId }) => {
      try {
        if (!boardId) return socket.emit('error', { message: 'boardId is required' });

        await collabService.validateBoardAccess(boardId, user._id);

        const roomName = `board:${boardId}`;
        await socket.join(roomName);
        collabService.addToRoom(boardId, socket.id, user);

        // Send active users to the newly joined client
        socket.emit('room:users', {
          users: collabService.getRoomUsers(boardId),
        });

        // Broadcast to everyone else that someone joined
        socket.to(roomName).emit('user:joined', {
          user: { _id: user._id, fullName: user.fullName, profileImageUrl: user.profileImageUrl },
        });

        logger.info('User joined board', { userId: user._id, boardId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    //  leave-board 
    socket.on('leave-board', ({ boardId }) => {
      handleLeave(socket, io, boardId, user);
    });

    //  element:update 
    socket.on('element:update', async ({ boardId, element }) => {
      try {
        if (!boardId || !element?.id) return;

        const roomName = `board:${boardId}`;

        // Immediately broadcast to everyone else don't wait for DB write.
        socket.to(roomName).emit('element:updated', {
          element,
          updatedBy: user._id,
        });

        // Persist async — failure is logged but doesn't kill the socket
        await collabService.persistElementUpsert(boardId, user._id, element);
      } catch (err) {
        logger.error('element:update error', { error: err.message });
      }
    });

    //  element:delete 
    // Client sends: { boardId, elementIds: string[] }
    socket.on('element:delete', async ({ boardId, elementIds }) => {
      try {
        if (!boardId || !Array.isArray(elementIds) || elementIds.length === 0) return;

        const roomName = `board:${boardId}`;
        socket.to(roomName).emit('element:deleted', { elementIds, deletedBy: user._id });

        await collabService.persistElementDelete(boardId, user._id, elementIds);
      } catch (err) {
        logger.error('element:delete error', { error: err.message });
      }
    });

    //  canvas:save 
    socket.on('canvas:save', async ({ boardId, canvas }) => {
      try {
        if (!boardId || !canvas) return;
        await collabService.persistCanvasSave(boardId, user._id, canvas);
        socket.emit('canvas:saved', { boardId });
      } catch (err) {
        socket.emit('error', { message: 'Canvas save failed' });
        logger.error('canvas:save error', { error: err.message });
      }
    });

    //  cursor:move
    socket.on('cursor:move', ({ boardId, x, y }) => {
      if (!boardId) return;
      collabService.updateCursor(boardId, socket.id, { x, y });
      socket.to(`board:${boardId}`).emit('cursor:moved', {
        userId:    user._id,
        fullName:  user.fullName,
        x,
        y,
      });
    });

    //  disconnect 
    socket.on('disconnect', (reason) => {
      logger.info('Collaboration socket disconnected', { userId: user._id, reason });

      // socket.rooms still contains the rooms at disconnect time
      socket.rooms.forEach((room) => {
        if (!room.startsWith('board:')) return;
        const boardId = room.replace('board:', '');
        handleLeave(socket, collab, boardId, user);
      });
    });
  });
};

//  Internal helper

const handleLeave = (socket, io, boardId, user) => {
  if (!boardId) return;
  const roomName = `board:${boardId}`;

  collabService.removeFromRoom(boardId, socket.id);
  socket.leave(roomName);

  // Tell everyone remaining in the room
  io.to(roomName).emit('user:left', {
    userId:   user._id,
    fullName: user.fullName,
    users:    collabService.getRoomUsers(boardId), // updated list
  });
};
