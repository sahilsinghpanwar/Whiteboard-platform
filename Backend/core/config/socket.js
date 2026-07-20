import { Server, Socket } from "socket.io";
import { env } from "./env.js";
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from "../logger/logger.js"; 


let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.CLIENT_URL,
            credentials: true,
        },

        pingTimeout: 60000, // 60 seconds
        pingInterval: 25000, // 25 seconds
    });


    io.use((socket, next) => {
        try{
            const token = socket.handshake.auth?.token;

            if(!token){
                logger.warn("Socket connection rejected: No access token provided.");
                return next(new Error("No access token provided. Please log in."));
            }

            const payload = verifyAccessToken(token);
            socket.user = {
                _id: payload.sub,
                fullName: payload.fullName,
                profileImageUrl: payload.profileImageUrl,
            };
            next();
        } catch (error) {
            logger.warn("Socket connection rejected: Invalid access token.");
            return next(new Error("Invalid access token. Please log in."));
        }
    });

    logger.info("Socket.io initialized");
    return io;

}

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocket() first.");
    }
    return io;
};