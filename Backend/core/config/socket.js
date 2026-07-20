import { verifyAccessToken } from "../utils/jwt.js";
import { authRepository } from "../../modules/auth/auth.repository.js";
import logger from "../logger/logger.js";

export const configureSocketAuth = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required: no token provided"));
      }

      const decoded = verifyAccessToken(token);
      const user = await authRepository.findById(decoded.userId);

      if (!user) {
        return next(new Error("Authentication failed: user not found"));
      }

      socket.user = {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      };

      logger.info("Socket authenticated", {
        socketId: socket.id,
        userId: socket.user._id,
      });

      next();
    } catch (error) {
      logger.warn("Socket authentication failed", {
        socketId: socket.id,
        error: error.message,
      });
      next(new Error("Authentication failed: invalid token"));
    }
  });
};