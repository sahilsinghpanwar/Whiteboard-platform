import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../logger/logger.js';

let isConfigured = false;

export const initCloudinary = () => {
  if (!isConfigured && env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key:    env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    isConfigured = true;
    logger.info('Cloudinary initialised');
  }
};

export const getCloudinary = () => {
  if (!isConfigured) {
    initCloudinary();
  }
  return cloudinary;
};

export { cloudinary };
