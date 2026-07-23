import * as boardService from './board.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';

// Board CRUD 

export const createBoard = async (req, res) => {
  const board = await boardService.createBoard(req.user._id, req.body);
  res.status(201).json(
    new ApiResponse(201, board, 'Board created successfully')
  );
};

export const getDashboardBoards = async (req, res) => {
  const boards = await boardService.getDashboardBoards(req.user._id);
  res.status(200).json(
    new ApiResponse(200, boards, 'Boards fetched successfully')
  );
};

export const getBoardById = async (req, res) => {
  const board = await boardService.getBoardById(req.params.boardId, req.user._id);
  res.status(200).json(
    new ApiResponse(200, board, 'Board fetched successfully')
  );
};

export const updateBoard = async (req, res) => {
  const board = await boardService.updateBoard(
    req.params.boardId,
    req.user._id,
    req.body
  );
  res.status(200).json(
    new ApiResponse(200, board, 'Board updated successfully')
  );
};

export const deleteBoard = async (req, res) => {
  await boardService.deleteBoard(req.params.boardId, req.user._id);
  res.status(200).json(
    new ApiResponse(200, null, 'Board deleted successfully')
  );
};

// Member Management 

export const inviteMember = async (req, res) => {
  const board = await boardService.inviteMember(
    req.params.boardId,
    req.user._id,
    req.body
  );
  const io = req.app.get('io');
  if (io) {
    io.of('/collaboration').to(`board:${board._id}`).emit('board:updated', { board });
  }

  res.status(200).json(
    new ApiResponse(200, board, 'Member invited successfully')
  );
};

export const updateMemberRole = async (req, res) => {
  const board = await boardService.updateMemberRole(
    req.params.boardId,
    req.user._id,
    req.params.memberId,
    req.body.role
  );
  const io = req.app.get('io');
  if (io) {
    io.of('/collaboration').to(`board:${board._id}`).emit('board:updated', { board });
  }

  res.status(200).json(
    new ApiResponse(200, board, 'Member role updated successfully')
  );
};

export const removeMember = async (req, res) => {
  const board = await boardService.removeMember(
    req.params.boardId,
    req.user._id,
    req.params.memberId
  );
  const io = req.app.get('io');
  if (io) {
    io.of('/collaboration').to(`board:${board._id}`).emit('board:updated', { board });
  }

  res.status(200).json(
    new ApiResponse(200, board, 'Member removed successfully')
  );
};

export const acceptInvitation = async (req, res) => {
  const board = await boardService.acceptInvitation(
    req.params.boardId,
    req.user._id
  );
  const io = req.app.get('io');
  if (io) {
    io.of('/collaboration').to(`board:${board._id}`).emit('board:updated', { board });
  }

  res.status(200).json(
    new ApiResponse(200, board, 'Invitation accepted successfully')
  );
};

export const declineInvitation = async (req, res) => {
  const response = await boardService.declineInvitation(
    req.params.boardId,
    req.user._id
  );
  const io = req.app.get('io');
  if (io) {
    // Decline just returns a message, not a board, so we shouldn't emit the message as a board.
    // However, if we wanted to update the board state for others, we'd need to fetch the updated board here.
    // For now, let's fetch it and emit it.
    const updatedBoard = await boardService.getBoardById(req.params.boardId, req.user._id);
    io.of('/collaboration').to(`board:${updatedBoard._id}`).emit('board:updated', { board: updatedBoard });
  }

  res.status(200).json(
    new ApiResponse(200, response, 'Invitation declined successfully')
  );
};

//  Canvas 

export const saveCanvas = async (req, res) => {
  const board = await boardService.saveCanvas(
    req.params.boardId,
    req.user._id,
    req.body.canvas
  );
  res.status(200).json(
    new ApiResponse(200, board, 'Canvas saved successfully')
  );
};

export const upsertElement = async (req, res) => {
  const board = await boardService.upsertElement(
    req.params.boardId,
    req.user._id,
    req.body.element
  );
  res.status(200).json(
    new ApiResponse(200, board, 'Element saved successfully')
  );
};

export const deleteElements = async (req, res) => {
  const board = await boardService.deleteElements(
    req.params.boardId,
    req.user._id,
    req.body.elementIds
  );
  res.status(200).json(
    new ApiResponse(200, board, 'Elements deleted successfully')
  );
};
