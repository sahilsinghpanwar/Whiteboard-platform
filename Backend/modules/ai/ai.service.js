import { getGeminiModel } from '../../core/config/gemini.js';
import { boardService }   from '../board/index.js';
import { ApiError }       from '../../core/utils/ApiError.js';
import { buildBoardContext, buildSelectionContext } from './contextBuilder.js';
import { buildBrainstormPrompt } from './prompts/brainstorm.js';
import { buildDiagramPrompt }    from './prompts/diagram.js';
import { buildSummaryPrompt }    from './prompts/summary.js';
import { buildImprovePrompt }    from './prompts/improve.js';
import {
  parseBrainstormResponse,
  parseDiagramResponse,
  parseSummaryResponse,
  parseImproveResponse,
} from './parser.js';


const callGemini = async (prompt, tier = 'flash') => {
  const modelName = tier === 'pro'
    ? 'gemini-1.5-pro'
    : 'gemini-1.5-flash';

  const model = getGeminiModel(modelName);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  } catch (err) {
    // Gemini quota / network errors
    if (err.message?.includes('RESOURCE_EXHAUSTED')) {
      throw ApiError.tooManyRequests('AI quota exceeded. Please try again in a moment.');
    }
    if (err.message?.includes('SAFETY')) {
      throw ApiError.badRequest('Request was blocked by safety filters. Please rephrase.');
    }
    throw ApiError.internal(`AI service error: ${err.message}`);
  }
};


//   Helper: fetch the board and assert the user has read access.
//   All AI features need the current canvas state.
 
const getBoardCanvas = async (boardId, userId) => {
  const board = await boardService.getBoardById(boardId, userId);
  return board.canvas;
};

//  Feature: Brainstorm 


//   Generate brainstorming sticky-note ideas based on board context + topic.
//   Returns an array of { title, description, color } — ready to place on canvas.
 
export const brainstorm = async (boardId, userId, topic) => {
  if (!topic?.trim()) throw ApiError.badRequest('A topic is required for brainstorming');

  const canvas  = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt  = buildBrainstormPrompt(context, topic.trim());
  const raw     = await callGemini(prompt, 'flash');

  return parseBrainstormResponse(raw);
};

//  Feature: Diagram 


//   Generate a flowchart / mind-map structure from a text description.
//   Returns { type, nodes, edges } — the frontend converts this to canvas elements.
 
export const generateDiagram = async (boardId, userId, description) => {
  if (!description?.trim()) throw ApiError.badRequest('A description is required to generate a diagram');

  const canvas  = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt  = buildDiagramPrompt(context, description.trim());

  // Use pro model for diagram — it needs to reason about spatial layout
  const raw = await callGemini(prompt, 'pro');
  return parseDiagramResponse(raw);
};

//  Feature: Summary 


//   Summarise everything currently on the board.
//   Returns { title, overview, keyPoints[], nextSteps[] }.
 
export const summariseBoard = async (boardId, userId) => {
  const canvas = await getBoardCanvas(boardId, userId);

  if (!canvas?.elements?.length) {
    throw ApiError.badRequest('The board is empty — nothing to summarise');
  }

  const context = buildBoardContext(canvas);
  const prompt  = buildSummaryPrompt(context);
  const raw     = await callGemini(prompt, 'flash');

  return parseSummaryResponse(raw);
};

//  Feature: Improve 


//   Improve selected text elements.
 
export const improveText = async (boardId, userId, selectedElements, instruction) => {
  if (!selectedElements?.length) {
    throw ApiError.badRequest('Select at least one text element to improve');
  }

  // Verify board access
  await getBoardCanvas(boardId, userId);

  // Extract text content from selected elements
  const textContent = selectedElements
    .map((el) => el.data?.content ?? el.content ?? '')
    .filter(Boolean)
    .join('\n');

  if (!textContent.trim()) {
    throw ApiError.badRequest('No text content found in the selected elements');
  }

  const prompt = buildImprovePrompt(textContent.trim(), instruction);
  const raw    = await callGemini(prompt, 'flash');

  return parseImproveResponse(raw);
};