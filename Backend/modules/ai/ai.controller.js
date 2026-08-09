import * as aiService from './ai.service.js';
import { ApiResponse } from '../../core/utils/ApiResponse.js';


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

export const summariseBoard = async (req, res) => {
  const summary = await aiService.summariseBoard(
    req.params.boardId,
    req.user._id
  );
  res.status(200).json(
    new ApiResponse(200, summary, 'Board summary generated')
  );
};

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
