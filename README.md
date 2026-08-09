<div align="center">

# 🎨 Real-Time AI Collaborative Whiteboard

An intelligent, enterprise-grade real-time collaborative whiteboard platform built with **React 19**, **Node.js**, **Socket.io**, and dual AI engines (**Google Gemini** + **Groq LLaMA 3.3**). Enables teams to draw, design, brainstorm, and generate instant interactive diagrams with live multiplayer collaboration and element locking.

[**🌐 Live Demo**](https://whiteboard-platform.vercel.app) • [**⚡ Frontend App**](https://whiteboard-platform.vercel.app) • [**⚙️ Backend API**](https://whiteboard-platform.vercel.app)

---

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-LLaMA_3.3-FF6F00?style=for-the-badge&logo=lightning&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [🌟 Overview & Core Capabilities](#-overview--core-capabilities)
- [🏗️ How It Works (System Architecture)](#️-how-it-works-system-architecture)
  - [1. Real-Time Synchronization Protocol](#1-real-time-synchronization-protocol)
  - [2. Granular Element Locking & LWW Conflict Resolution](#2-granular-element-locking--lww-conflict-resolution)
  - [3. Dual AI Generation Engine](#3-dual-ai-generation-engine)
  - [4. Permission Epoch Caching](#4-permission-epoch-caching)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🚀 Quick Start Guide (How to Start)](#-quick-start-guide-how-to-start)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository](#step-1-clone-the-repository)
  - [Step 2: Backend Configuration](#step-2-set-up-backend)
  - [Step 3: Frontend Configuration](#step-3-set-up-frontend)
  - [Step 4: Run Application](#step-4-run-application)
- [⚡ WebSocket Event Reference](#-websocket-event-reference)
- [🔌 REST API Documentation](#-rest-api-documentation)
- [🌐 Deployment Configuration](#-deployment-configuration)
- [🛡️ License](#️-license)

---

## 🌟 Overview & Core Capabilities

The **Real-Time AI Collaborative Whiteboard** combines high-performance 2D canvas rendering with low-latency WebSockets and generative AI capabilities. It bridges team brainstorming, system design, and AI automation into a unified digital workspace.

### Core Highlights:
- 🚀 **Zero-Lag Multi-User Collaboration**: Live multiplayer cursors, real-time object transformations, and live participant presence.
- 🔒 **Granular Element Locking**: Prevents simultaneous edit conflicts by showing dynamic dashed boundary overlays (`🔒 [User Name]`) around elements currently held by collaborators.
- 🤖 **Multi-Engine AI Assistance**: Generate production-grade Flowcharts, Mindmaps, and Sequence diagrams from simple text descriptions using **Groq (LLaMA 3.3 70B)** and **Google Gemini (1.5 / 2.0 Flash & Pro)** with automatic failover.
- 🖼️ **Multimodal Vision AI (Sketch to Code)**: Upload hand-drawn wireframes or sketches to receive detailed architectural breakdowns and clean production HTML/CSS code.
- 💡 **AI Brainstorming & Text Refinement**: Convert topics into organized sticky-note grids, refine text tone, or generate board summaries in 1-click.

---

## 🏗️ How It Works (System Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT (React 19 + Konva)                        │
│  - Infinite 2D HTML5 Canvas                                                     │
│  - Optimistic Local UI State Updates                                            │
│  - WebSocket Event Listeners & Lock Indicator Overlays                          │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │                                 │
                 REST API (HTTP)                     Sockets (ws://)
                        │                                 │
                        ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js + Express 5)                      │
│  - JWT & Google OAuth 2.0 Security                                              │
│  - Socket.io Namespaces (/collaboration & /chat)                                 │
│  - In-Memory Element Lock Registry & Permission Epoch Caching                   │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │                                 │
           Database Read / Write                     AI Orchestration
                        │                                 │
                        ▼                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────────────┐
│     MongoDB Atlas (Database)  │         │   DUAL AI GENERATION ENGINE           │
│ - Users & Auth Credentials    │         │ - Primary: Groq LLaMA 3.3 70B         │
│ - Boards & Canvas JSON Store  │         │ - Fallback: Google Gemini 1.5 / 2.0   │
└───────────────────────────────┘         └───────────────────────────────────────┘
```

### 1. Real-Time Synchronization Protocol
When a user draws a shape or moves an object:
1. The **React-Konva** canvas updates locally **optimistically** for smooth 60 FPS interactions.
2. The client emits an `element:update` or `cursor:move` event over the `/collaboration` Socket.io namespace.
3. The server validates user permissions using an in-memory **Permission Epoch Cache** (0 DB queries per update during active editing).
4. The server broadcasts `element:updated` or `cursor:moved` to all other connected clients in the board room.

### 2. Granular Element Locking & LWW Conflict Resolution
- **Element Locking**: Selecting or dragging a shape emits an `element:lock` event. The server registers the lock in `elementLocks` keyed by `boardId:elementId` and bound to the user's `socketId`. Other users see a colored dashed border overlay with a badge (`🔒 Alice`). Double-click text edits and selection locks automatically release via `element:unlock` or upon socket disconnect (`disconnecting` event).
- **Last-Write-Wins (LWW)**: Every element modification includes an ISO timestamp. The backend tracks the latest numeric timestamp per element using `elementVersionMap`. Stale updates from high-latency clients are rejected with an `element:rejected` payload containing `lastKnownState` to silently revert the client.
- **Server Clamping**: Client timestamps are clamped to server `Date.now()` to prevent future clock skew lockouts.

### 3. Dual AI Generation Engine
- **Primary Engine**: **Groq SDK** utilizing `llama-3.3-70b-versatile` for ultra-fast (sub-second) JSON responses.
- **Failover Engine**: If Groq rate-limits or fails, requests fall back automatically to **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
- **Vision Engine**: **Gemini Vision** receives base64 canvas screenshots, analyzes layout structure, and generates HTML/CSS components with UX recommendations.

### 4. Permission Epoch Caching
- Board permissions (`canUserEdit`) are cached in memory for 5 minutes (`permissionCache`).
- Every member mutation (`inviteMember`, `updateMemberRole`, `acceptInvitation`, `declineInvitation`, `removeMember`) advances an in-memory per-board `boardEpoch`.
- In-flight database checks verify that the epoch remained unchanged before caching results, preventing asynchronous race conditions.

---

## ✨ Key Features

### 🎨 Canvas & Styling Suite
- **Freehand Pen & Eraser**: High-performance drawing tool with tension curves and proximity eraser.
- **Shape Generator**: Rectangles, ellipses, straight lines, directional arrows, text overlays, and sticky notes.
- **Image Import**: Drag-and-drop or upload external image assets via Cloudinary.
- **Selection Toolbar**: Multi-select elements with `⌘A` / `Ctrl+A`, group selection, 1-click **Select All**, **Delete Selected**, and **Clear Board**.
- **Infinite Navigation**: Smooth wheel zooming (20% to 400%) and stage panning.

### ⚡ Real-Time Collaboration
- **Live Multiplayer Cursors**: Smooth throttled (20 updates/sec) cursor tracking with custom user color badges.
- **Visual Lock Overlays**: Remote editing lock indicators rendering dashed stroke boxes around elements held by active collaborators.
- **Live User Presence**: Sidebar dock showing active users, status indicators, and online member avatars.
- **Built-in Chat Room**: Dedicated real-time `/chat` namespace for team discussions inside the board.

### 🤖 AI Assistant Capabilities
- **Diagram Generator**: Prompt AI to generate complete **Flowcharts**, **Mindmaps**, or **Sequence Diagrams**. Automatically converts structured JSON into native canvas shapes and connectors without overlapping existing elements.
- **AI Brainstorming**: Input any topic to generate organized sticky-note idea grids.
- **AI Text Improver**: Select any text element or sticky note and instruct AI to polish, rewrite, format, or adjust text tone.
- **AI Board Summarizer**: Analyzes all elements on canvas and produces overview summaries, key points, and next steps.
- **AI Vision Sketch-to-Code**: Convert hand-drawn canvas wireframes directly into production HTML/CSS code.

### 🔐 Security & Access Control
- **Dual Auth Systems**: Custom JWT (Access & Refresh tokens with HTTP-only cookies) + **Google OAuth 2.0**.
- **Role-Based Access Control (RBAC)**: Owner, Editor, and View-Only board permissions.
- **Viewer Enforcement**: View-only users can inspect the board but UI editing controls, lock requests, and AI canvas modifications are strictly gated.

### 📤 Export & Utility
- **Export Options**: 1-click export to high-res **PNG**, **JPEG**, or **PDF**.
- **Shareable Invite Links**: One-click room link copying with confetti animations.

---

## 🛠️ Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Modern UI component rendering & concurrent mode |
| **Canvas Engine** | **Konva / React-Konva** | HTML5 2D canvas object model, transformers & event handling |
| **Build System** | **Vite 6** | Lightning-fast HMR and bundle optimization |
| **Styling** | **Tailwind CSS v4** | Utility-first responsive design system |
| **Icons & UI** | **Phosphor Icons, Lucide, Radix UI** | Accessible UI primitives & vector icons |
| **Backend Runtime** | **Node.js 20+ & Express 5** | REST API framework & HTTP service |
| **Real-Time Engine** | **Socket.io 4** | WebSockets server for real-time collaboration |
| **Database** | **MongoDB & Mongoose ORM** | Document store for users, boards & canvas JSON models |
| **Primary AI Engine** | **Groq SDK (LLaMA 3.3 70B)** | High-speed structured JSON & text generation |
| **Vision & Fallback AI**| **Google Generative AI (Gemini)** | Multimodal vision analysis & fallback text generation |
| **Authentication** | **JWT, Passport.js (Google OAuth)**| Token management & third-party OAuth 2.0 |
| **Asset Storage** | **Cloudinary API** | Media upload & CDN storage |

---

## 📁 Repository Structure

```
Whiteboard-platform/
├── Backend/                         # Express 5 API & Socket.io WebSockets Server
│   ├── core/                        # Infrastructure
│   │   ├── config/                  # Database, Gemini, Groq, Passport configuration
│   │   ├── logger/                  # Winston logger instance
│   │   ├── middleware/              # Auth, CORS, Error handler, Rate limit, Validation
│   │   └── utils/                   # ApiError, ApiResponse, AsyncHandler
│   ├── modules/                     # Domain Modules
│   │   ├── ai/                      # AI Prompts (agent, diagram, brainstorm, summary, improve), Parser & Service
│   │   ├── auth/                    # Login, Register, Refresh Token, Google OAuth
│   │   ├── board/                   # Board CRUD, Member Roles, Canvas Persistence
│   │   ├── collaboration/           # Socket.io handlers, Room registry, Lock Engine, LWW versioning
│   │   └── user/                    # User Profile & Account Management
│   ├── app.js                       # Express app configuration & routes mounting
│   └── server.js                    # HTTP Server & Socket.io initialization
│
├── Frontend/                        # React 19 Single Page Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/           # Board Cards, Create Modal, Invite Banner
│   │   │   ├── ui/                  # Button, Dialog, Tooltip, Popover primitives
│   │   │   └── whiteboard/          # Canvas, Toolbar, TopBar, AIPanel, ChatPanel, MembersPanel
│   │   ├── context/                 # AuthContext (user session state)
│   │   ├── hooks/                   # useBoardSockets (Socket.io hook)
│   │   ├── lib/                     # Axios API service & helper functions
│   │   └── pages/                   # Landing, Login, Register, Dashboard, BoardPage, Settings
│   ├── vite.config.js               # Vite build settings & aliases
│   └── package.json                 # Frontend dependencies
│
├── render.yaml                      # Render Blueprint backend deployment config
├── vercel.json                      # Vercel SPA routing frontend deployment config
└── README.md                        # Documentation
```

---

## 🚀 Quick Start Guide (How to Start)

Follow these step-by-step instructions to get the platform running locally on your development machine.

### Prerequisites
Before starting, ensure you have installed:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance running OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.

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

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` variables:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whiteboard?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
   JWT_ACCESS_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=7d
   
   CLIENT_URL=http://localhost:5173

   # AI Keys (At least one required for AI features)
   GEMINI_API_KEY=your_google_gemini_api_key
   GROQ_API_KEY=your_groq_api_key

   # Optional Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Optional Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/google/callback
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   > 🟢 **Backend running at**: `http://localhost:5001`

---

### Step 3: Set Up Frontend

1. Open a new terminal tab and navigate to the `Frontend` directory:
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

4. Configure your `.env` variables:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_BACKEND_URL=http://localhost:5001
   ```

5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 🌐 **Frontend running at**: `http://localhost:5173`

---

### Step 4: Run Application

1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Sign Up** to create a new account or log in via Google OAuth.
3. Click **Create New Board** on the Dashboard.
4. Copy the room link or open a second browser window / incognito tab to test real-time collaboration, cursor tracking, and AI diagram generation!

---

## ⚡ WebSocket Event Reference

The platform uses two dedicated Socket.io namespaces: `/collaboration` (canvas sync & locking) and `/chat` (team messaging).

### `/collaboration` Namespace Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-board` | Client ➔ Server | `{ boardId }` | Joins a board room session |
| `leave-board` | Client ➔ Server | `{ boardId }` | Leaves a board room session |
| `element:lock` | Client ➔ Server | `{ boardId, elementId }` | Requests lock ownership on an element |
| `element:unlock` | Client ➔ Server | `{ boardId, elementId }` | Releases lock ownership on an element |
| `element:update` | Client ➔ Server | `{ boardId, element }` | Sends element mutation (LWW timestamped) |
| `element:delete` | Client ➔ Server | `{ boardId, elementIds }` | Deletes elements from board |
| `cursor:move` | Client ➔ Server | `{ boardId, x, y }` | Transmits mouse pointer position (throttled 50ms) |
| `room:users` | Server ➔ Client | `{ users, locks }` | Receives initial active user list & current lock snapshot |
| `element:locked` | Server ➔ Client | `{ elementId, lockedBy }` | Broadcasts remote lock indicator overlay |
| `element:unlocked` | Server ➔ Client | `{ elementId }` | Notifies that an element lock was released |
| `elements:unlocked:all` | Server ➔ Client | `{ userId }` | Clears all locks held by a disconnected user |
| `element:rejected` | Server ➔ Client | `{ elementId, reason, lastKnownState }` | Reverts client state on stale update or lock conflict |
| `element:updated` | Server ➔ Client | `{ element, updatedBy }` | Broadcasts modified element to collaborators |
| `element:deleted` | Server ➔ Client | `{ elementIds, deletedBy }` | Broadcasts element deletion to room |
| `cursor:moved` | Server ➔ Client | `{ userId, fullName, x, y }` | Renders remote collaborator cursor position |

---

## 🔌 REST API Documentation

### Authentication (`/api/v1/auth`)
- `POST /register`: Create a new user account.
- `POST /login`: Authenticate credentials & return JWT tokens.
- `POST /refresh`: Refresh access token using refresh cookie.
- `POST /logout`: Revoke session & clear cookies.
- `GET /google`: Initiate Google OAuth 2.0 authentication flow.

### Board Management (`/api/v1/boards`)
- `GET /`: Fetch user dashboard boards.
- `POST /`: Create a new whiteboard.
- `GET /:id`: Fetch board data & canvas JSON elements.
- `PATCH /:id`: Update board metadata (title, background).
- `DELETE /:id`: Delete board (Owner only).
- `POST /:id/members`: Invite collaborator by email.
- `PATCH /:id/members/:memberId`: Update member role (Editor/Viewer).
- `DELETE /:id/members/:memberId`: Remove member or leave board.

### AI Engine Services (`/api/v1/boards/:id/ai`)
- `POST /agent`: Execute natural language agent commands.
- `POST /vision`: Analyze canvas sketch image & output production HTML/CSS.
- `POST /brainstorm`: Generate sticky-note idea grids for a topic.
- `POST /diagram`: Generate interactive Flowcharts, Mindmaps, or Sequence diagrams.
- `GET/POST /summary`: Generate board overview & key takeaways.
- `POST /improve`: Polish or rewrite text inside selected canvas elements.

---

## 🌐 Deployment Configuration

### Frontend (Vercel)
The repository includes a pre-configured `vercel.json` file for single-page application routing.
1. Import repository into **Vercel Dashboard**.
2. Set Root Directory to `./Frontend`.
3. Add Environment Variables:
   - `VITE_API_URL=https://your-backend-domain.com`
   - `VITE_BACKEND_URL=https://your-backend-domain.com`

### Backend (Render)
The repository includes a `render.yaml` Blueprint specification.
1. Connect repository on **Render Dashboard**.
2. Select **New Blueprint Instance**.
3. Fill in secret environment variables (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`).

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ by [Sahil Singh Panwar](https://github.com/sahilsinghpanwar)**

[**⭐ Star this Repository**](https://github.com/sahilsinghpanwar/Whiteboard-platform) if you find it helpful!

</div>
