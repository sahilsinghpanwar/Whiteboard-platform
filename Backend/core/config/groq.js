import Groq from 'groq-sdk';
import { env } from './env.js';
import logger from '../logger/logger.js';

let groqClient = null;

export const initGroq = () => {
  if (!groqClient && env.GROQ_API_KEY) {
    try {
      groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
      logger.info('Groq client initialised');
    } catch (err) {
      logger.error('Failed to initialise Groq client', { error: err.message });
    }
  }
};

export const getGroqClient = () => {
  if (!groqClient) {
    initGroq();
  }
  return groqClient;
};
