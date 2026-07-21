/**
 * Upload API
 */

import api from "@/shared/api/axios.js";

export const uploadApi = {
  profileImage: (file) => {
    const form = new FormData();
    form.append("image", file);
    return api.post("/upload/profile-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  boardImage: (boardId, file) => {
    const form = new FormData();
    form.append("image", file);
    return api.post(`/upload/board-image/${boardId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  thumbnail: (boardId, file) => {
    const form = new FormData();
    form.append("image", file);
    return api.post(`/upload/thumbnail/${boardId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};