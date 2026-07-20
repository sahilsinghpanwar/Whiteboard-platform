import multer from "multer";
import ApiError from "../utils/ApiError.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const memoryStorage = multer.memoryStorage();


const imageFileFilter = (req, file, callback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      ApiError.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF`
      ),
      false
    );
  }
};


const imageUploader = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: imageFileFilter,
});


export const uploadSingleImage = imageUploader.single("image");

export const uploadMultipleImages = imageUploader.array("images", 5);
