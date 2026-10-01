# Prof. S.N. Bose Boys Hostel — Community Platform 🏛️

> **"Your Hostel. Your Voice. Your Community."**
> 
> *A private space for the students of Prof. S.N. Bose Boys Hostel to connect, share thoughts, ask questions, discuss hostel life, and speak freely — without revealing their real names to other students.*

---

## 🌟 Project Overview

**Prof. S.N. Bose Boys Hostel Community** is an exclusive, private web application engineered for hostel students. It solves a classic university dilemma: students often withhold honest questions, constructive feedback on hostel amenities, or candid discussions due to peer judgment, senior-junior dynamics, or social pressure.

By combining **peer privacy** with **institutional backend verification**, students communicate using rotating anonymous personas while the administration and platform maintain a safe, harassment-free environment.

---

## 🏛️ Year Structure (Hostel Architecture)

Prof. S.N. Bose Boys Hostel accommodates:
- **2nd Year**
- **3rd Year**
- **4th Year**

*(There is NO 1st Year in this hostel. All schemas, registration dropdowns, room authorization logic, and channels strictly enforce this structure).*

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Axios, Tailwind CSS v4, Lucide React Icons, Socket.IO Client |
| **Backend** | Node.js, Express.js (ES Modules), Helmet, Morgan, CORS, Dotenv, Socket.IO Server |
| **Authentication & Identity** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing, Custom Identity Generator |
| **Real-Time Communication** | Socket.IO with JWT Handshake Authentication & Room-Level Authorization |
| **Database** | MongoDB & Mongoose (Resilient connection layer, compound indexing, strict schema validations) |
| **Tooling** | Concurrently, Nodemon |

---

## 🛡️ Key Architecture Principle: Dual-Tier Identity

- **Peer Layer (Protected Privacy):** Other students only see pseudonyms (e.g., `Anonymous Panda 🐼`, `Midnight Owl 🦉`, `Silent Rider 🏍️`), masked avatars, and verified hostel year badges (`2nd Year`, `3rd Year`, `4th Year`). Real names and emails are never exposed in client bundles or public room/message API responses.
- **Backend Layer (Secure Accountability):** The Express & MongoDB backend retains verified institutional identity credentials privately for session management, role-based access, and anti-abuse moderation.

---

## 📁 Project Directory Structure

```text
hostel-community/
├── client/
│   ├── public/
│   │   └── logo.svg                 # S.N. Bose physics & anonymity shield emblem
│   ├── src/
│   │   ├── assets/                  # Static assets
│   │   ├── components/              # UI components
│   │   │   ├── AboutPlatform.jsx    # S.N. Bose heritage & platform vision
│   │   │   ├── AnonymousIdentity.jsx# Interactive pseudonym & persona simulator
│   │   │   ├── CommunityPreview.jsx # Cards for Global and 2nd, 3rd, 4th Year rooms
│   │   │   ├── Features.jsx         # Platform feature highlights
│   │   │   ├── Footer.jsx           # Attributions & hostel badge
│   │   │   ├── Hero.jsx             # Hero section & mock live feed
│   │   │   ├── HowItWorksModal.jsx  # 3-step privacy workflow modal
│   │   │   ├── JoinModal.jsx        # Live telemetry & development roadmap modal
│   │   │   ├── Navbar.jsx           # Responsive navigation with live API health pulse
│   │   │   ├── ProtectedRoute.jsx   # Route guard redirecting unauthenticated users to /login
│   │   │   └── PublicRoute.jsx      # Route guard redirecting authenticated users to /dashboard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication & user profile state manager
│   │   │   └── CommunityContext.jsx # Global community React context
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js    # Heartbeat polling for backend health
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx       # Persistent wrapper layout
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx         # Real-time Socket.IO chat page with message feed & composer
│   │   │   ├── Dashboard.jsx        # Authenticated student dashboard with authorized room cards
│   │   │   ├── LandingPage.jsx      # Complete landing experience
│   │   │   ├── Login.jsx            # Student login page
│   │   │   ├── NotFound.jsx         # Custom 404 handler
│   │   │   └── Register.jsx         # Student registration with year selection & privacy notice
│   │   ├── services/
│   │   │   ├── api.js               # Central Axios client with JWT Bearer interceptor
│   │   │   ├── authService.js       # Register, login, me, and logout API wrappers
│   │   │   ├── healthService.js     # Health API query wrapper
│   │   │   ├── roomService.js       # Room discovery and message retrieval/posting API wrapper
│   │   │   └── socketService.js     # Socket.IO client manager with JWT handshake & event handlers
│   │   ├── App.jsx                  # React Router configuration & guards
│   │   ├── index.css                # Tailwind CSS v4 & custom glassmorphism styles
│   │   └── main.jsx                 # Application entry point
│   ├── .env                         # Client local environment configuration
│   ├── .env.example                 # Client template
│   ├── index.html                   # HTML entry with Plus Jakarta Sans & JetBrains Mono
│   ├── package.json                 # Frontend dependencies (including socket.io-client)
│   └── vite.config.js               # Vite config with proxy to Express backend
│
├── server/
│   ├── config/
│   │   └── db.js                    # Mongoose connection with resilient fallback
│   ├── controllers/
│   │   ├── auth.controller.js       # Register, login, getMe, and logout handlers
│   │   ├── health.controller.js     # Health check & system diagnostics controller
│   │   └── room.controller.js       # Get rooms, get room by slug, get messages, send message
│   ├── middleware/
│   │   ├── auth.middleware.js       # Bearer JWT verification & req.user attachment
│   │   ├── errorHandler.js          # 404 and centralized error handler
│   │   └── requestLogger.js         # HTTP duration and route logging
│   ├── models/
│   │   ├── Message.js               # Message model referencing Room and User (safe population)
│   │   ├── Room.js                  # Room model with slug, type, and isUserAuthorized method
│   │   └── User.js                  # Mongoose schema for students with bcryptjs hashing
│   ├── routes/
│   │   ├── api.routes.js            # Main API router aggregator
│   │   ├── auth.routes.js           # Authentication & profile routes
│   │   ├── health.routes.js         # GET /api/health route
│   │   └── room.routes.js           # Community room & message routes
│   ├── services/
│   │   ├── auth.service.js          # Business logic for auth, passwords & JWT
│   │   ├── identity.service.js      # Unique anonymous pseudonym & avatar generator
│   │   ├── message.service.js       # Paginated messages & safe sender formatting
│   │   └── room.service.js          # Idempotent room seeding & backend access control
│   ├── socket/
│   │   └── chat.socket.js           # Socket.IO server with JWT handshake & room access control
│   ├── utils/
│   │   ├── logger.js                # Structured timestamped console logger
│   │   └── responseHelper.js        # Standardized JSON response envelope
│   ├── .env                         # Server local environment configuration
│   ├── .env.example                 # Server template
│   ├── app.js                       # Express app configuration & middleware
│   ├── package.json                 # Backend dependencies (including socket.io)
│   └── server.js                    # HTTP listener, Socket.IO server & graceful shutdown
│
├── .gitignore                       # Git ignore rules for node_modules, .env, dist
├── package.json                     # Monorepo concurrency orchestrator
└── README.md                        # Documentation
```

---

## 🗄️ Database Models

### 1. Room Model (`server/models/Room.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['global', 'year'] },
  allowedYear: { 
    type: String, 
    enum: ['2nd Year', '3rd Year', '4th Year', null], 
    default: null 
  },
  icon: { type: String, default: 'Globe' },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Message Model (`server/models/Message.js`)
```javascript
{
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: Date,
  updatedAt: Date
}
// Compound indexes:
// { room: 1, createdAt: 1 }
// { room: 1, createdAt: -1 }
```

### 3. User Model (`server/models/User.js`)
```javascript
{
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }, // Hashed with bcryptjs (salt 10)
  year: { 
    type: String, 
    required: true, 
    enum: ['2nd Year', '3rd Year', '4th Year'] 
  },
  anonymousName: { type: String, required: true, trim: true },
  anonymousAvatar: { type: String, required: true, trim: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛡️ Room Authorization Matrix

| User Academic Year | 🌍 Global Room | 🎓 2nd Year | 🎓 3rd Year | 🎓 4th Year |
| :--- | :---: | :---: | :---: | :---: |
| **2nd Year Student** | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | ❌ Denied (403) |
| **3rd Year Student** | ✅ Allowed | ❌ Denied (403) | ✅ Allowed | ❌ Denied (403) |
| **4th Year Student** | ✅ Allowed | ❌ Denied (403) | ❌ Denied (403) | ✅ Allowed |

- `GET /api/rooms` returns **only** the authorized rooms for the logged-in student.
- Attempting to access an unauthorized room via HTTP or Socket.IO results in a strict **403 Forbidden** / `room_error` event.

---

## ⚡ Socket.IO Real-Time Chat

### Handshake Authentication
The client provides its JWT in the connection handshake:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('snbose_auth_token') }
});
```
Unauthenticated or expired socket connections are immediately rejected by server middleware.

### Events

| Event Name | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId }` or `{ roomSlug }` | Verifies user authorization and joins the Socket.IO room. |
| `room_joined` | Server ➔ Client | `{ success: true, roomId, roomName, slug }` | Confirms successful room join. |
| `room_error` | Server ➔ Client | `{ message: string }` | Emitted when an unauthorized room join or send error occurs. |
| `leave_room` | Client ➔ Server | `{ roomId }` | Removes the socket from the room channel. |
| `send_message` | Client ➔ Server | `{ roomId, content }` | Verifies access, validates text (1-1000 chars), saves to MongoDB, populates safe sender, and broadcasts to room. |
| `new_message` | Server ➔ Room | `{ id, room, content, sender: { anonymousName, anonymousAvatar, year }, createdAt }` | Broadcast to all clients in the room in real time. |

---

## 🔑 REST API Endpoints

### Rooms & Messages
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms` | Authenticated | Returns accessible rooms for the student. |
| `GET` | `/api/rooms/:slug` | Authenticated | Returns room details if authorized (403 if unauthorized). |
| `GET` | `/api/rooms/:roomId/messages` | Authenticated | Paginated message history (`?page=1&limit=30`) with safe sender population. |
| `POST` | `/api/rooms/:roomId/messages` | Authenticated | Sends a new message (1-1000 chars) with safe sender population. |

### Authentication & System
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a student (2nd, 3rd, or 4th Year), assigns anonymous persona, issues JWT. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials with bcrypt and returns a JWT. |
| `GET` | `/api/auth/me` | Authenticated | Returns current student's community-facing profile. |
| `POST` | `/api/auth/logout` | Public/Protected | Cleans up session. |
| `GET` | `/api/health` | Public | Returns system health and MongoDB connectivity status. |

---

## 🚀 Running the Project

### Concurrent Dev Mode (Frontend + Backend)
```bash
npm run dev
```
- **Frontend App:** `http://localhost:5173`
- **Backend API & Sockets:** `http://localhost:5000`

### Independent Execution
```bash
# Frontend only
cd client && npm run dev

# Backend only
cd server && npm run dev
```

### Production Build
```bash
cd client && npm run build
```
