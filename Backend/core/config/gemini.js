import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';
import { logger } from '../logger/logger.js';

let geminiClient = null;

export const initGemini = () => {
  if (!geminiClient && env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    logger.info('Gemini client initialised');
  }
};

export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  if (!geminiClient) {
    initGemini();
  }
  return geminiClient.getGenerativeModel({ model: modelName });
};