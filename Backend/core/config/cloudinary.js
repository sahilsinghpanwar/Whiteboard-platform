import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../logger/logger.js';

export const initCloudinary = () => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  logger.info('Cloudinary initialised');
};

export { cloudinary };
