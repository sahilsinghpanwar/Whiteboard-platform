import { getGeminiModel } from '../../core/config/gemini.js';
import { boardService }   from '../board/index.js';
import { ApiError }       from '../../core/utils/ApiError.js';
import { buildBoardContext, buildSelectionContext, formatConversationHistory } from './contextBuilder.js';
import { buildAgentPrompt } from './prompts/agentPrompt.js';
import { buildBrainstormPrompt } from './prompts/brainstorm.js';
import { buildDiagramPrompt }    from './prompts/diagram.js';
import { buildSummaryPrompt }    from './prompts/summary.js';
import { buildImprovePrompt }    from './prompts/improve.js';
import {
  parseAgentResponse,
  parseBrainstormResponse,
  parseDiagramResponse,
  parseSummaryResponse,
  parseImproveResponse,
} from './parser.js';

const callGemini = async (prompt, tier = 'flash') => {
  const modelNames = tier === 'pro'
    ? ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash-latest']
    : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-pro'];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      const errMsg = err.message || String(err);
      console.error(`Gemini model ${modelName} attempt failed:`, errMsg);
      lastError = err;

      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('rate limit')
      ) {
        throw ApiError.tooManyRequests(
          'Gemini API rate limit or free tier quota reached. Please wait ~30 seconds and try again.'
        );
      }

      if (errMsg.includes('SAFETY')) {
        throw ApiError.badRequest('Request was blocked by safety filters. Please rephrase your prompt.');
      }
    }
  }

  const lastErrMsg = lastError?.message || String(lastError);
  if (
    lastErrMsg.includes('429') ||
    lastErrMsg.includes('RESOURCE_EXHAUSTED') ||
    lastErrMsg.includes('Quota exceeded')
  ) {
    throw ApiError.tooManyRequests(
      'Gemini API rate limit or free tier quota reached. Please wait ~30 seconds and try again.'
    );
  }

  throw ApiError.internal(`AI service error: ${lastErrMsg || 'Failed to generate AI response'}`);
};

const getBoardCanvas = async (boardId, userId) => {
  const board = await boardService.getBoardById(boardId, userId);
  return board.canvas;
};


export const processAgentRequest = async (boardId, userId, prompt, selectedElementIds = [], conversationHistory = []) => {
  if (!prompt?.trim()) throw ApiError.badRequest('Prompt is required');

  const canvas = await getBoardCanvas(boardId, userId);
  const boardContext = buildBoardContext(canvas, selectedElementIds);
  const selectionContext = buildSelectionContext(canvas, selectedElementIds);
  const historyText = formatConversationHistory(conversationHistory);

  const fullPrompt = buildAgentPrompt({
    boardContext,
    selectionContext,
    conversationHistory: historyText,
    prompt: prompt.trim(),
  });

  const rawText = await callGemini(fullPrompt, 'flash');
  return parseAgentResponse(rawText);
};


export const brainstorm = async (boardId, userId, topic) => {
  if (!topic?.trim()) throw ApiError.badRequest('A topic is required for brainstorming');
  const canvas = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt = buildBrainstormPrompt(context, topic.trim());
  const raw = await callGemini(prompt, 'flash');
  return parseBrainstormResponse(raw);
};

export const generateDiagram = async (boardId, userId, description) => {
  if (!description?.trim()) throw ApiError.badRequest('A description is required to generate a diagram');
  const canvas = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt = buildDiagramPrompt(context, description.trim());
  const raw = await callGemini(prompt, 'pro');
  return parseDiagramResponse(raw);
};

export const summariseBoard = async (boardId, userId) => {
  const canvas = await getBoardCanvas(boardId, userId);
  if (!canvas?.elements?.length) {
    throw ApiError.badRequest('The board is empty — nothing to summarise');
  }
  const context = buildBoardContext(canvas);
  const prompt = buildSummaryPrompt(context);
  const raw = await callGemini(prompt, 'flash');
  return parseSummaryResponse(raw);
};

export const improveText = async (boardId, userId, selectedElements, instruction) => {
  if (!selectedElements?.length) {
    throw ApiError.badRequest('Select at least one text element to improve');
  }
  await getBoardCanvas(boardId, userId);
  const textContent = selectedElements
    .map((el) => el.data?.content ?? el.content ?? '')
    .filter(Boolean)
    .join('\n');

  if (!textContent.trim()) {
    throw ApiError.badRequest('No text content found in the selected elements');
  }

  const prompt = buildImprovePrompt(textContent.trim(), instruction);
  const raw = await callGemini(prompt, 'flash');
  return parseImproveResponse(raw);
};