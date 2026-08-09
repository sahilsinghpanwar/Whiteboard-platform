import * as aiService from './ai.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';


/**
 * Handle AI Agent commands (Natural language board manipulation)
 * POST /api/v1/boards/:boardId/ai/agent
 */
export const processAgentRequest = async (req, res) => {
  const result = await aiService.processAgentRequest(
    req.params.boardId,
    req.user._id,
    req.body.prompt,
    req.body.selectedElementIds || [],
    req.body.conversationHistory || []
  );
  res.status(200).json(
    new ApiResponse(200, result, 'Agent request processed')
  );
};


/**
 * Handle Vision AI requests (Convert hand-drawn sketch images into canvas shapes)
 * POST /api/v1/boards/:boardId/ai/vision
 */
export const processVisionRequest = async (req, res) => {
  const result = await aiService.processVisionRequest(
    req.params.boardId,
    req.user._id,
    req.body.prompt,
    req.body.image,
    req.body.selectedElementIds || []
  );
  res.status(200).json(
    new ApiResponse(200, result, 'Gemini Vision sketch request processed')
  );
};

/**
 * Generate brainstorm ideas/sticky notes for a specific topic
 * POST /api/v1/boards/:boardId/ai/brainstorm
 */

export const brainstorm = async (req, res) => {
  const ideas = await aiService.brainstorm(
    req.params.boardId,
    req.user._id,
    req.body.topic
  );
  res.status(200).json(
    new ApiResponse(200, ideas, 'Brainstorm ideas generated')
  );
};


/**
 * Generate structured diagrams (Flowcharts, Mindmaps, Sequence Diagrams)
 * POST /api/v1/boards/:boardId/ai/diagram
 */
export const generateDiagram = async (req, res) => {
  const diagram = await aiService.generateDiagram(
    req.params.boardId,
    req.user._id,
    req.body.description
  );
  res.status(200).json(
    new ApiResponse(200, diagram, 'Diagram generated')
  );
};

/**
 * Generate overview & summary of current whiteboard content
 * GET/POST /api/v1/boards/:boardId/ai/summary
 */

export const summariseBoard = async (req, res) => {
  const summary = await aiService.summariseBoard(
    req.params.boardId,
    req.user._id
  );
  res.status(200).json(
    new ApiResponse(200, summary, 'Board summary generated')
  );
};

/**
 * Improve, rewrite, or polish text inside selected whiteboard elements
 * POST /api/v1/boards/:boardId/ai/improve
 */
export const improveText = async (req, res) => {
  const result = await aiService.improveText(
    req.params.boardId,
    req.user._id,
    req.body.selectedElements,
    req.body.instruction
  );
  res.status(200).json(
    new ApiResponse(200, result, 'Text improved')
  );
};
