cat > /home/claude/backend/package.json << 'EOF'
{
  "name": "ai-collaborative-whiteboard-backend",
  "version": "1.0.0",
  "description": "Production-grade AI Collaborative Whiteboard Backend",
  "main": "src/server.js",
  "type": "module",
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint src/**/*.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.5.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.9.4",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "socket.io": "^4.8.1",
    "winston": "^3.17.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
EOF
echo "Done"
Output

Done
Done