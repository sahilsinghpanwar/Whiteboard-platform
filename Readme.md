# Whiteboard Platform

## What it does
A real-time collaborative digital whiteboard application featuring interactive canvas drawing, shape tools, media attachments, AI integration, and instant multi-user synchronization.

## Tech Stack
React | Node.js | MongoDB | Express | Socket.io | TailwindCSS

## Live Demo
https://whiteboard-platform.vercel.app

## How to run

### 1. Install Dependencies

Install dependencies for both Backend and Frontend services:

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment Variables

Set up your `.env` file inside the `Backend` directory using `Backend/.env.example` as a template:

```env
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
...
```

### 3. Start the Application

Run the backend and frontend servers:

```bash
# Start Backend
cd Backend
npm start

# Start Frontend (in a separate terminal)
cd Frontend
npm run dev
```