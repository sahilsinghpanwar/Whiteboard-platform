import * as exportService from './export.service.js';
import { ApiResponse }    from '../../core/utils/ApiResponse.js';
import { ApiError }       from '../../core/utils/ApiError.js';


export const exportBoard = async (req, res) => {
  const { boardId }   = req.params;
  const { type, base64Image } = req.body;

  if (!['json', 'png', 'pdf'].includes(type)) {
    throw ApiError.badRequest("type must be one of: 'json', 'png', 'pdf'");
  }

  switch (type) {
    case 'json': {
      const data = await exportService.exportAsJSON(boardId, req.user._id);
    
      return res.status(200).json(new ApiResponse(200, data, 'Board exported as JSON'));
    }
    case 'png': {
      const data = await exportService.exportAsPNG(boardId, req.user._id, base64Image);
      return res.status(200).json(new ApiResponse(200, data, 'Board exported as PNG'));
    }
    case 'pdf': {
      const data = await exportService.exportAsPDF(boardId, req.user._id, base64Image);
      return res.status(200).json(new ApiResponse(200, data, 'Board exported as PDF'));
    }
  }
};
