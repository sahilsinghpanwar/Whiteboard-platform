<div align="center">

# 🎨 Real-Time AI Collaborative Whiteboard

An intelligent, real-time digital whiteboard application designed for seamless team collaboration, dynamic canvas drawing, and instant AI-assisted diagram generation.

[**🌐 Live Demo**](https://whiteboard-platform.vercel.app) • [**⚡ Frontend (Vercel)**](https://whiteboard-platform.vercel.app) • [**⚙️ Backend (Render)**](https://whiteboard-platform.vercel.app)

---

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

## 🌟 Key Features

### 🎨 Interactive Canvas & Drawing Tools
- **Freehand Drawing**: Brush/pencil with customizable stroke width, opacity, and color palette.
- **Rich Shape Library**: Rectangles, circles, lines, arrows, and custom shapes with live transformers.
- **Sticky Notes & Text Engine**: Rich text formatting, sticky notes for brainstorming sessions.
- **Image Import**: Upload and place external images onto the canvas using Cloudinary integration.
- **Selection & Manipulation**: Drag, resize, rotate, group, and delete canvas objects seamlessly.
- **Pan & Zoom**: Infinite smooth canvas navigation with zoom controls.

### ⚡ Real-Time Collaboration
- **Instant Synchronization**: High-frequency canvas state updates powered by Socket.io.
- **Multi-User Presence**: Live cursor tracking with user name tags and presence avatars.
- **Room Management**: Create public/private boards, invite collaborators with room IDs or shareable links.

### 🤖 Integrated AI Assistant
- **Smart Diagram Generation**: Generate flowcharts, mind maps, and technical architecture directly on canvas using **Google Gemini AI** and **Groq**.
- **AI Brainstorming**: Prompt AI to suggest ideas, summarize whiteboard contents, or format notes.

### 🔐 Authentication & Security
- **Dual Authentication**: Native JWT authentication (Access & Refresh tokens) + **Google OAuth 2.0**.
- **Role-Based Access**: Room owners, editors, and view-only permissions.
- **Security Headers & Rate Limiting**: Production-ready setup with Helmet, CORS, and Express Rate Limit.

### 📤 Export & Sharing
- **Multi-Format Export**: Export canvas drawings to high-resolution **PNG**, **JPEG**, or vector-grade **PDF**.
- **Instant Link Sharing**: One-click room link copying with confetti animations.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React 19, HTML5 Canvas (Konva / React-Konva), Tailwind CSS v4, Lucide Icons, Vite |
| **Backend** | Node.js, Express.js (v5), Socket.io |
| **Database** | MongoDB & Mongoose ORM |
| **AI Integration** | Google Generative AI (@google/generative-ai), Groq SDK |
| **Cloud Storage** | Cloudinary (Image assets) |
| **Auth & Security** | JWT, Passport.js (Google OAuth 2.0), bcryptjs, Zod validation |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📁 Repository Structure

```
Whiteboard-platform/
├── Backend/                 # Express REST API & Socket.io server
│   ├── core/                # Logger, database config, middleware
│   ├── modules/             # Auth, User, Board, and AI modules
│   ├── app.js               # Express application setup
│   ├── server.js            # HTTP server & Socket.io initialization
│   ├── package.json         # Backend dependencies
│   └── .env.example         # Environment template for Backend
│
├── Frontend/                # React SPA built with Vite & Konva
│   ├── public/              # Static assets & icons
│   ├── src/                 # React components, pages, hooks, sockets
│   ├── vite.config.js       # Vite configuration
│   ├── package.json         # Frontend dependencies
│   └── .env.example         # Environment template for Frontend
│
├── render.yaml              # Render backend deployment configuration
├── vercel.json              # Vercel frontend deployment configuration
└── README.md                # Project documentation
```

---

## 🚀 Quick Start Guide

Follow these step-by-step instructions to get the platform running on your local machine.

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/sahilsinghpanwar/Whiteboard-platform.git
cd Whiteboard-platform
```

---

### Step 2: Set Up Backend

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and fill in your credentials:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/whiteboard
   JWT_ACCESS_SECRET=your_super_secret_access_key
   JWT_REFRESH_SECRET=your_super_secret_refresh_key
   JWT_ACCESS_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   
   # Optional Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Optional Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/google/callback

   # Optional AI Capabilities
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   > Server will run at: `http://localhost:5001`

---

### Step 3: Set Up Frontend

1. Open a new terminal tab and navigate to `Frontend`:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env`:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_BACKEND_URL=http://localhost:5001
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   > Client application will open at: `http://localhost:5173`

---

## ⚡ Socket.io Real-Time Events

| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `join-room` | Client ➔ Server | Join a specific whiteboard session |
| `draw-step` | Client ➔ Server | Broadcast live drawing strokes to room members |
| `cursor-move` | Client ➔ Server | Send cursor position coordinates for live multiplayer view |
| `canvas-update` | Client ➔ Server ➔ Client | Sync modified shape/text/sticky objects across all clients |
| `user-joined` | Server ➔ Client | Notify room members when a new collaborator joins |
| `user-left` | Server ➔ Client | Update user presence when a collaborator disconnects |

---

## 🌐 Deployment Configuration

### Frontend (Vercel)
The project includes a ready-to-use `vercel.json` file.
1. Connect your repository to **Vercel**.
2. Set Root Directory to `./` or import the project.
3. Add `VITE_API_URL` and `VITE_BACKEND_URL` in environment settings pointing to your live backend.

### Backend (Render)
The repository contains a `render.yaml` Blueprint file for automatic 1-click deployment on Render:
1. Connect repository on **Render Dashboard**.
2. Select **Blueprint** deployment.
3. Configure the required secret environment variables (`MONGODB_URI`, `JWT_ACCESS_SECRET`, etc.).

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by [Sahil Singh Panwar](https://github.com/sahilsinghpanwar)</sub>
</div>
