import { getGeminiModel } from '../../core/config/gemini.js';
import { getGroqClient }   from '../../core/config/groq.js';
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

// ─────────────────────────────────────────────────────────────────────────────
// GROQ ENGINE (Ultra-Fast Text Completion & Deep Reasoning with Model Fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute text completion using Groq LLaMA/Mixtral models.
 * Automatically falls back to Gemini if Groq client is unavailable or rate-limited.
 */
const callGroq = async (prompt) => {
  const groq = getGroqClient();
  if (!groq) {
    console.warn('Groq client not available, falling back to Gemini text generation');
    return callGemini(prompt, 'flash');
  }

  const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
  let lastError = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const text = completion.choices[0]?.message?.content;
      if (text) return text;
    } catch (err) {
      console.error(`Groq model ${model} attempt failed:`, err.message);
      lastError = err;
    }
  }

  console.warn('All Groq model attempts failed, falling back to Gemini text model');
  return callGemini(prompt, 'flash');
};

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI ENGINE (Multimodal & Text Completion with Auto Fallback to Groq)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute text generation via Google Gemini API with fallback tiers.
 * Automatically fails over to Groq if Gemini key is unauthorized or rate-limited.
 */
const callGemini = async (prompt, tier = 'flash') => {
  const modelNames = tier === 'pro'
    ? ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash']
    : ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];

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

      if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('API key')) {
        console.warn('Gemini API Key is invalid or unauthorized. Falling back to Groq text completion.');
        return callGroq(prompt);
      }

      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('rate limit')
      ) {
        console.warn('Gemini rate limit reached. Falling back to Groq.');
        return callGroq(prompt);
      }
    }
  }

  const lastErrMsg = lastError?.message || String(lastError);
  console.warn(`Gemini API failed (${lastErrMsg}), attempting Groq fallback...`);
  return callGroq(prompt);
};

/**
 * Process multimodal image inputs (canvas screenshots / hand-drawn sketches)
 * using Gemini Vision models.
 */
const callGeminiVision = async (prompt, imageBase64) => {
  const cleanImageBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const mimeTypeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

  const imagePart = {
    inlineData: {
      data: cleanImageBase64,
      mimeType,
    },
  };

  const visionModelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  let lastError = null;

  for (const modelName of visionModelNames) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.error(`Gemini Vision model ${modelName} attempt failed:`, err.message);
      lastError = err;

      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        throw ApiError.badRequest(
          'Gemini API key is missing or invalid. Please set a valid GEMINI_API_KEY from Google AI Studio in Backend/.env'
        );
      }
    }
  }

  throw ApiError.internal(`Gemini Vision error: ${lastError?.message || 'Failed to process sketch image.'}`);
};

/**
 * Helper to fetch canvas state from database for a given board ID
 */
const getBoardCanvas = async (boardId, userId) => {
  const board = await boardService.getBoardById(boardId, userId);
  return board.canvas;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC AI SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process AI Agent requests to generate/manipulate whiteboard elements
 */
export const processAgentRequest = async (
  boardId,
  userId,
  prompt,
  selectedElementIds = [],
  conversationHistory = [],
  preferredEngine = 'groq'
) => {
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

  let rawText;
  if (preferredEngine === 'gemini') {
    rawText = await callGemini(fullPrompt, 'pro');
  } else {
    rawText = await callGroq(fullPrompt);
  }

  return parseAgentResponse(rawText);
};

/**
 * Process Vision AI request for sketch-to-code / UI analysis
 */
export const processVisionRequest = async (boardId, userId, prompt, imageBase64, selectedElementIds = []) => {
  if (!prompt?.trim()) throw ApiError.badRequest('Prompt instruction is required');
  if (!imageBase64?.trim()) throw ApiError.badRequest('Canvas screenshot / sketch image is required');

  const canvas = await getBoardCanvas(boardId, userId);
  const selectionContext = buildSelectionContext(canvas, selectedElementIds);

  const visionPrompt = `
You are an expert UI/UX developer, fullstack architect, and senior canvas design assistant.
The user has provided a screenshot/sketch of their whiteboard canvas along with an instruction: "${prompt.trim()}".

Selected elements context:
${selectionContext}

INSTRUCTIONS FOR DEEP COMPREHENSIVE ANSWER:
1. Examine the provided sketch image closely to understand what the user has drawn or laid out.
2. Provide a DEEP, IN-DEPTH breakdown explaining what was recognized in the drawing, the layout architecture, and user flow.
3. Produce clean, production-grade HTML/CSS component code corresponding to the sketch and request.
4. Give actionable suggestions for improving the design, accessibility (a11y), responsive styling, and color harmony.

Return your response with detailed explanations and HTML/CSS code enclosed in \`\`\`html ... \`\`\` codeblocks.
`;

  const rawResult = await callGeminiVision(visionPrompt, imageBase64);
  return {
    rawResponse: rawResult,
    processedAt: new Date().toISOString(),
  };
};

/**
 * Generate brainstorm ideas formatted as sticky notes
 */
export const brainstorm = async (boardId, userId, topic) => {
  if (!topic?.trim()) throw ApiError.badRequest('A topic is required for brainstorming');
  const canvas = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt = buildBrainstormPrompt(context, topic.trim());
  const raw = await callGroq(prompt);
  return parseBrainstormResponse(raw);
};

/**
 * Generate structured flowcharts, mindmaps, or sequence diagrams
 */
export const generateDiagram = async (boardId, userId, description) => {
  if (!description?.trim()) throw ApiError.badRequest('A description is required to generate a diagram');
  const canvas = await getBoardCanvas(boardId, userId);
  const context = buildBoardContext(canvas);
  const prompt = buildDiagramPrompt(context, description.trim());
  const raw = await callGroq(prompt);
  return parseDiagramResponse(raw);
};

/**
 * Generate overview and key insights summary of board content
 */
export const summariseBoard = async (boardId, userId) => {
  const canvas = await getBoardCanvas(boardId, userId);
  if (!canvas?.elements?.length) {
    throw ApiError.badRequest('The board is empty — nothing to summarise');
  }
  const context = buildBoardContext(canvas);
  const prompt = buildSummaryPrompt(context);
  const raw = await callGroq(prompt);
  return parseSummaryResponse(raw);
};

/**
 * Improve text formatting, clarity, or style for selected elements
 */
export const improveText = async (boardId, userId, selectedElements, instruction) => {
  if (!selectedElements?.length) {
    throw ApiError.badRequest('Select at least one text element to improve');
  }
  await getBoardCanvas(boardId, userId);
  const textContent = selectedElements
    .map((el) => el.data?.text ?? el.data?.content ?? el.text ?? el.content ?? (typeof el.data === 'string' ? el.data : ''))
    .filter(Boolean)
    .join('\n');

  if (!textContent.trim()) {
    throw ApiError.badRequest('No text content found in the selected elements');
  }

  const prompt = buildImprovePrompt(textContent.trim(), instruction);
  const raw = await callGroq(prompt);
  return parseImproveResponse(raw);
};