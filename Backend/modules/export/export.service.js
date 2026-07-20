import { boardService } from '../board/index.js';
import { cloudinary }   from '../../core/config/cloudinary.js';
import { ApiError }     from '../../core/utils/ApiError.js';
import { logger }       from '../../core/logger/logger.js';
import * as boardRepo   from '../board/board.repository.js';

export const exportAsJSON = async (boardId, userId) => {
  const board = await boardService.getBoardById(boardId, userId);

  return {
    exportedAt:  new Date().toISOString(),
    boardId:     board._id,
    title:       board.title,
    description: board.description,
    canvas:      board.canvas,
  };
};

// PNG Export 
export const exportAsPNG = async (boardId, userId, base64Image) => {
  if (!base64Image) throw ApiError.badRequest('base64Image is required for PNG export');

  // Validate board access
  await boardService.getBoardById(boardId, userId);

  // Strip the data URL prefix if present
  const base64Data = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/png;base64,${base64Image}`;

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder:        'collabboard/exports',
      public_id:     `board_${boardId}_export_${Date.now()}`,
      resource_type: 'image',
      format:        'png',
    });

    // Save as the board's latest thumbnail
    await boardRepo.updateThumbnail(boardId, result.secure_url);

    return {
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height,
    };
  } catch (err) {
    logger.error('PNG export failed', { boardId, error: err.message });
    throw ApiError.internal('Failed to export board as PNG');
  }
};

//  PDF Export 
export const exportAsPDF = async (boardId, userId, base64Image) => {
  if (!base64Image) throw ApiError.badRequest('base64Image is required for PDF export');

  await boardService.getBoardById(boardId, userId);

  // Dynamic import — pdfkit is only needed on the export path
  const PDFDocument = (await import('pdfkit')).default;

  const imageBuffer = Buffer.from(
    base64Image.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ autoFirstPage: false, margin: 0 });
    const chunks = [];

    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      try {
        const result = await new Promise((res, rej) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder:        'collabboard/exports',
              public_id:     `board_${boardId}_pdf_${Date.now()}`,
              resource_type: 'raw',
              format:        'pdf',
            },
            (error, r) => (error ? rej(error) : res(r))
          );
          stream.end(pdfBuffer);
        });

        resolve({ url: result.secure_url, publicId: result.public_id });
      } catch (err) {
        reject(ApiError.internal('Failed to upload PDF to storage'));
      }
    });

    // Add one page sized to the image
    doc.addPage({ size: [1920, 1080] });
    doc.image(imageBuffer, 0, 0, { width: 1920, height: 1080 });
    doc.end();
  });
};
