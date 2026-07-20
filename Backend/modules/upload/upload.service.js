import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../../core/utils/ApiError.js';

//  Multer Configuration 
// Memory storage: file is held in buffer, never written to disk.
// We stream the buffer directly to Cloudinary.

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 10;

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
  },
});

//  Cloudinary Upload 


//   Upload a buffer directly to Cloudinary using a stream.
//   Returns the Cloudinary result object (we need secure_url and public_id).
 

const uploadToCloudinary = (buffer, { folder, publicId } = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `collabboard/${folder ?? 'board-assets'}`,
      resource_type: 'image',
      ...(publicId && { public_id: publicId }),
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(ApiError.internal(`Cloudinary upload failed: ${error.message}`));
      resolve(result);
    });

    stream.end(buffer);
  });

//  Service Methods 
export const uploadBoardAsset = async (file, boardId) => {
  if (!file) throw ApiError.badRequest('No file provided');

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'board-assets',
    publicId: `board_${boardId}_${Date.now()}`,
  });

  return {
    url:       result.secure_url,
    publicId:  result.public_id,
    width:     result.width,
    height:    result.height,
    format:    result.format,
    bytes:     result.bytes,
  };
};


export const uploadAvatar = async (file, userId) => {
  if (!file) throw ApiError.badRequest('No file provided');

  // Use a deterministic publicId so re-uploading replaces the old file
  const result = await uploadToCloudinary(file.buffer, {
    folder:   'avatars',
    publicId: `avatar_${userId}`,
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
  };
};


export const deleteAsset = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};