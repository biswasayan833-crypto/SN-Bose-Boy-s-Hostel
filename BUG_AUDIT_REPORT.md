# Comprehensive Bug Audit, Debugging & Stabilization Report
**Project:** Prof. S.N. Bose Boys Hostel Community  
**Platform:** MERN Full-Stack (MongoDB, Express, React 19, Node.js, Socket.IO, Three.js)  
**Audit Date:** October 2026  
**Auditor Roles:** Senior Full-Stack Engineer, QA Engineer, Security Auditor & 3D WebGL Specialist  
**Status:** Audit Complete — Awaiting Approval Before Repair Phase  

---

## 1. Executive Summary & Architecture Overview

Prof. S.N. Bose Boys Hostel Community is a private collegiate platform designed for authenticated residents of Prof. S.N. Bose Boys Hostel. The application accommodates **2nd Year, 3rd Year, and 4th Year residents** (accommodating strictly no 1st-year residents as the hostel houses only sophomore through senior years). The architecture centers around:

1. **Frontend Architecture:**
   - Single-Page Application built on **React 19.2.8** and **Vite 8.3.0** with **Tailwind CSS v4**.
   - State management via React Context (`AuthContext` and `CommunityContext`).
   - Cinematic 3D landing page utilizing **Three.js 0.186.1** and `@react-three/fiber 9.8.1` / `@react-three/drei 10.7.9`, featuring:
     - An ambient lattice constellation background (`Community3DCanvas.jsx`).
     - A 3D Bose Hostel Resident character (`StudentCharacter.jsx` using `bose_student.glb` with procedural fallback).
     - An interactive physical 3D bulletin board (`NoticeBoard3D.jsx`) linked to an accessible modal (`NoticeBoardModal.jsx`).
     - A scripted sequence runner (`useCharacterSequence.js`) transitioning from walking → stop → visitor tracking → wave → idle.
   - Client routing managed via **React Router DOM v7**.

2. **Backend & API Architecture:**
   - **Node.js (ES Modules)** running **Express 4.21.2** with HTTP server wrapping Socket.IO.
   - Real-time bidirectional communication via **Socket.IO 4.8.4** for message streaming, unread counters, reactions, deletions, announcements, and polls.
   - Document store on **MongoDB** managed through **Mongoose 8.10.1**.
   - Security primitives including **Helmet 8.0.0**, **CORS 2.8.5**, **Bcryptjs 3.0.3**, and **JSON Web Tokens (jsonwebtoken 9.0.3)**.
   - Secure media storage (`storage.service.js`) with magic-byte file signature validation (`fileValidator.js`), MIME verification, and path traversal protections.

3. **Data & Privacy Guarantees:**
   - Dual-identity model: Real identity (`fullName`, `email`, password hash) is stored privately for hostel verification, while community interaction uses an active, pseudonymized persona (`anonymousName`, `anonymousAvatar`, `year`).
   - Unique anonymous identity constraint enforced via partial MongoDB unique index on `anonymousIdentityKey` (`{ isActive: true }`).

---

## 2. Baseline Verification & Execution Results

### A. Backend Test Suite
- **Command:** `npm --prefix hostel-community/server run test`
- **Runner:** Node.js native test runner (`node --test --test-concurrency=1 tests/*.test.js`)
- **Execution Time:** ~41.7s
- **Results:**
  - **Total Test Suites:** 14 suites
  - **Total Tests:** 145 tests
  - **Passed:** 145 tests
  - **Failed:** 0 tests
  - **Skipped:** 0 tests
- **Coverage Summary:**
  - `admin.test.js` (Moderation, reports processing, 403 authorization enforcement)
  - `deletion.test.js` (Message soft deletion, ownership checks, reaction clearing)
  - `identityUniqueness.test.js` (Normalization, collision rejection, migration idempotency)
  - `mediaSharing.test.js` (MIME spoofing rejection, 5MB limit, streaming headers, path traversal defense)
  - `notifications.test.js` (Delivery, unread counters, actor privacy, ownership)
  - `privacy.test.js` (Zero leakage of fullName/email in messages and reactions; exclusion of 1st Year)
  - `profile.test.js` (Profile retrieval, pseudonym updates, password change)
  - `reactions.test.js` (Allowed emoji types, duplicate toggle, reaction counts)
  - `regression.test.js` (End-to-end integration and error handling)
  - `reports.test.js` (Report creation, reason constraints, duplicate report blocking)
  - `roomUnread.test.js` (Per-room unread counters, read state synchronization)
  - `searchDiscovery.test.js` (Full-text discovery, pagination, regex escaping, cross-room rejection)
  - `socket.test.js` (Real-time handshake, room joining, events broadcast)
  - `task7.test.js` (Announcements, polls, vote changes, pinned messages)

### B. Client Linter Verification
- **Command:** `npm --prefix hostel-community/client run lint` (`oxlint`)
- **Results:** **4 Errors, 49 Warnings**
- **Critical Failures:**
  1. `src/components/PollCard.jsx:39-42`: React Hook `useState` is called conditionally after an early return (`if (!poll) return null;`). **Direct violation of the Rules of Hooks.**
  2. `src/components/3d/character/useCharacterSequence.js:29-32`: Reading `useRef().current` during render body.
  3. Multiple components invoking `setState` synchronously within `useEffect` bodies triggering cascading re-renders.
  4. Impure function calls (`new Date()`) directly inside render cycles (`AnnouncementCard.jsx`, `NotificationDropdown.jsx`).

### C. Client Production Build
- **Command:** `npm --prefix hostel-community/client run build` (`vite build`)
- **Results:** Build completed successfully in 3.79s.
  - Chunks generated: `index.html` (1.34 kB), `CharacterCanvas.js` (206.26 kB), `index.js` (610.45 kB), `three.js` (807.35 kB).
  - Bundle size warning: `three.js` and `index.js` chunks exceed 500 kB.

### D. Backend Startup Verification
- **Command:** `node server.js`
- **Results:** Startup succeeded on `http://localhost:5000`.
  - MongoDB connection established.
  - Idempotent room seed created/verified 4 community channels (`global-room`, `2nd-year`, `3rd-year`, `4th-year`).
  - Identity migration verified 20 resident records with index synchronization.
  - Health check endpoint `/api/health` responded with HTTP 200 `{ status: "healthy", database: { status: "connected", isOnline: true } }`.

---

## 3. Prioritized Bug Inventory

| Bug ID | Severity | Category | Affected File(s) | Summary | Status |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **BUG-FE-01** | **P1** | Frontend / React | `client/src/components/PollCard.jsx` | Conditional `useState` calls violating React Rules of Hooks | **Fixed & Verified** |
| **BUG-FE-02** | **P1** | Frontend / Runtime | `client/src/components/JoinModal.jsx` | React 19 runtime crash rendering object as child (`data?.database`) | **Fixed & Verified** |
| **BUG-RT-01** | **P1** | Real-Time / Sockets | `client/src/services/socketService.js` | Broken reconnection: client does not rejoin active room on reconnect | **Confirmed** |
| **BUG-RT-02** | **P1** | Deployment / Network | `client/src/services/socketService.js`, `client/vite.config.js` | Production socket URL fallback hardcoded to `localhost:5000` | **Confirmed** |
| **BUG-SEC-01** | **P1** | Security / Privacy | `server/services/message.service.js`, `server/socket/chat.socket.js` | Internal MongoDB `User._id` leaked in message sender payload | **Fixed & Verified** |
| **BUG-SEC-02** | **P1** | Security / Abuse | `server/app.js`, `server/routes/auth.routes.js` | Missing rate limiting on login, registration, and chat endpoints | **Confirmed** |
| **BUG-BE-03** | **P1** | Security / NoSQL | `server/services/auth.service.js` | Type confusion / NoSQL injection in login inputs | **Confirmed** |
| **BUG-FE-03** | **P2** | Frontend / UI Auth | `client/src/pages/AdminAnnouncements.jsx` | Missing client-side role guard renders admin controls to students | **Confirmed** |
| **BUG-FE-04** | **P2** | Frontend / Routing | `client/src/components/ProtectedRoute.jsx` | `ProtectedRoute` lacks role enforcement (`requiredRole="admin"`) | **Confirmed** |
| **BUG-BE-01** | **P2** | Backend / API | Multiple controllers (`room`, `message`, `poll`, etc.) | Unhandled Mongoose `CastError` on invalid ObjectIds returns HTTP 500 | **Confirmed** |
| **BUG-BE-02** | **P2** | Backend / API | `server/middleware/errorHandler.js` | Error handler drops `err.statusCode`, transforming errors into HTTP 500 | **Confirmed** |
| **BUG-SEC-03** | **P2** | Security / CORS | `server/app.js` | CORS origin string overrides array fallback for localhost vs 127.0.0.1 | **Confirmed** |
| **BUG-SEC-04** | **P2** | Security / Auth | `server/controllers/auth.controller.js` | Stateless logout does not invalidate or blacklist JWT token | **Confirmed** |
| **BUG-3D-01** | **P2** | Three.js / Layout | `client/src/components/3d/character/HostelDeskSetup.jsx`, `CharacterCanvas.jsx` | Oversized study desk & monitor clipping resident character | **Confirmed** |
| **BUG-3D-02** | **P2** | Three.js / Rigging | `client/src/components/3d/character/StudentCharacter.jsx` | 3D backpack & collar meshes detached from skeletal spine bone | **Confirmed** |
| **BUG-QA-01** | **P2** | Testing / QA | `client/package.json` | Total absence of automated frontend unit and integration tests | **Confirmed** |
| **BUG-FE-05** | **P3** | Frontend / Lint | Multiple components (`AnnouncementCard`, `NotificationDropdown`, etc.) | Oxlint purity, fast-refresh, and unused import warnings | **Confirmed** |
| **BUG-3D-03** | **P3** | Frontend / Responsive | `client/src/components/Hero.jsx` | Tablet (`md`) viewport stacks 3D character and live feed awkwardly | **Confirmed** |

---

## 4. Detailed Bug Reports

### BUG-FE-01: Conditional Hook Execution in PollCard
- **Severity:** P1 (Major)
- **Category:** Frontend / React Runtime
- **Affected File:** `hostel-community/client/src/components/PollCard.jsx` (`lines 23–44`)
- **Status:** **Fixed & Verified**
- **Verified Root Cause:** An early return check `if (!poll) return null;` was placed on line 23 ahead of four `useState` hook declarations on lines 39–42 (`selectedOption`, `isChangingVote`, `submitting`, `error`). In React components where `poll` evaluates to falsy on any render path, this violates the fundamental Rules of Hooks, causing potential React runtime crashes and 4 AST errors in Oxlint.
- **Files Changed:** `hostel-community/client/src/components/PollCard.jsx`
- **Exact Changes Made:**
  - Safely destructured poll properties with fallback `const { ... } = poll || {};`.
  - Moved all four `useState` hook calls (`selectedOption`, `isChangingVote`, `submitting`, `error`) before the early return guard.
  - Positioned `if (!poll) return null;` immediately below the hook declarations so hooks execute unconditionally and in the identical order on every render.
  - Preserved all existing voting, vote change, retraction, and admin management logic without UI or dependency alterations.
- **Commands Executed & Results:**
  1. `npx --prefix hostel-community/client oxlint hostel-community/client/src/components/PollCard.jsx`: Passed with exit code 0 (`Found 2 warnings and 0 errors`). The 4 `react-hooks(rules-of-hooks)` errors are eliminated.
  2. `npm --prefix hostel-community/client run lint`: Passed with exit code 0 across all 63 files (`Found 49 warnings and 0 errors`).
  3. `npm --prefix hostel-community/client run build`: Passed with exit code 0 (`vite build` compiled all 2,588 modules cleanly in 730ms).
  4. `git diff hostel-community/client/src/components/PollCard.jsx`: Verified that only the hook ordering and safe fallback were changed.
- **Verification Limitations:** No frontend unit test framework (Vitest/Jest) is configured in `client/package.json` (`BUG-QA-01`), so automated component unit tests could not be run. Static AST verification and production build compilation passed with 0 errors.
- **Remaining Pre-existing Warnings:** 2 non-blocking warnings in `PollCard.jsx` (`expiresAt` and `handleRetract` declared but unused in the current template). Both were preserved to maintain backward compatibility with existing component APIs.

---

### BUG-FE-02: React 19 Runtime Crash in JoinModal (`data.database`)
- **Severity:** P1 (Major)
- **Category:** Frontend / Runtime Exception
- **Affected File:** `hostel-community/client/src/components/JoinModal.jsx` (`lines 22–51, 125`)
- **Status:** **Fixed & Verified**
- **Verified Root Cause:** Type mismatch between backend health response schema (`data.database` is an object `{ status: "connected", isOnline: true }` returned by `/api/health`) and the frontend JSX template which rendered `{data?.database || 'Connected'}`. In React 19, passing an object directly into JSX throws an uncaught fatal render crash: `Uncaught Error: Objects are not valid as a React child (found: object with keys {status, isOnline})`.
- **Files Changed:** `hostel-community/client/src/components/JoinModal.jsx`
- **Exact Changes Made:**
  - Added safe resolution helper `databaseStatusText` to handle all possible schemas:
    - Explicit connected/online states (`'connected'`, `'online'`, `isOnline: true`) return `'Connected'`.
    - Explicit disconnected/offline states (`'disconnected'`, `'offline'`, `isOnline: false`) return `'Disconnected'`.
    - Explicit connecting states return `'Connecting'`.
    - Missing, null, undefined, empty objects, invalid status strings, or unexpected types safely fallback to `'Unknown'` (instead of assuming connected).
  - Replaced `{data?.database || 'Connected'}` with `{databaseStatusText}` in the diagnostics JSX card.
  - Preserved existing modal layout, room join behavior, auth state CTAs, and loading indicators without altering unrelated code.
- **Commands Executed & Results:**
  1. `npx --prefix hostel-community/client oxlint hostel-community/client/src/components/JoinModal.jsx`: Passed with exit code 0 (`Found 1 warning and 0 errors`).
  2. `npm --prefix hostel-community/client run lint`: Passed with exit code 0 across 63 files (`Found 49 warnings and 0 errors`).
  3. `npm --prefix hostel-community/client run build`: Passed with exit code 0 (`vite build` compiled all 2,588 modules in 706ms).
  4. Regression check `node scratch/test_join_modal_db_status.js`: Ran 20 automated test cases covering valid backend responses, offline states, raw strings, missing fields, booleans, and invalid objects; 20/20 passed with strict string assertions and `'Unknown'` fallbacks verified.
  5. `git diff hostel-community/client/src/components/JoinModal.jsx`: Verified that only the status resolution helper and JSX binding were modified.
- **Verification Limitations:** Component-level React DOM rendering was validated via the Node-based regression assertion suite and Vite build compilation, but automated browser-based DOM testing was not run because no test runner is configured in `client/package.json` (`BUG-QA-01`).
- **Remaining Pre-existing Warnings:** 1 pre-existing warning in `JoinModal.jsx` (`CheckCircle` imported from `lucide-react` but unused in the current design) was preserved to avoid touching unrelated code.

---

### BUG-RT-01: Broken Socket Reconnect Handler
- **Severity:** P1 (Major)
- **Category:** Socket.IO / Real-Time Communication
- **Affected File:** `hostel-community/client/src/services/socketService.js`, `hostel-community/client/src/pages/ChatPage.jsx`
- **Reproduction Steps:**
  1. Log in as a resident and enter a chat room (e.g. `/community/global-room`).
  2. Disconnect and reconnect the network (or restart the backend Node process).
  3. Send a message from another user in that room.
- **Expected Behavior:** Upon automatic socket reconnection, the client automatically re-joins the current active room channel (`join_room`), ensuring continuous message streaming.
- **Actual Behavior:** When the socket reconnects, a new socket connection ID is generated on the server. The server joins the socket only to `user:<id>` and `year:<year>`, but NOT to the room channel. The client does not re-emit `join_room` upon reconnection.
- **Root Cause:** Socket room memberships are ephemeral per socket ID. `socketService.js` tracks reconnection in `connect()`, but does not maintain an `activeRooms` set or re-emit `join_room` in its `connect` listener.
- **Proposed Fix:** Store the currently active roomId in `socketService` and attach a listener `this.socket.on('connect', () => { if (this.activeRoomId) this.joinRoom(this.activeRoomId); })`.
- **Regression Tests Required:** Integration test simulating socket disconnect and verify messages still deliver after reconnect.
- **Verification Status:** Confirmed via code analysis of `chat.socket.js` and `socketService.js`.

---

### BUG-RT-02: Hardcoded Localhost Socket URL in Production
- **Severity:** P1 (Major)
- **Category:** Deployment / Networking
- **Affected File:** `hostel-community/client/src/services/socketService.js` (`line 43`), `hostel-community/client/vite.config.js`
- **Reproduction Steps:**
  1. Deploy frontend to any production host without setting `VITE_SOCKET_URL`.
  2. Inspect WebSocket network requests in production.
- **Expected Behavior:** In production, Socket.IO connects to the window origin (`/`) or to an explicit `VITE_SOCKET_URL`. In development, Vite dev proxy handles `/socket.io`.
- **Actual Behavior:** `socketService.js` line 43 executes: `const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';`. In production without `VITE_SOCKET_URL`, it tries to connect to `http://localhost:5000` on the end user's local computer. Furthermore, `vite.config.js` proxies `/api` but lacks a proxy configuration for `/socket.io`.
- **Root Cause:** Hardcoded dev fallback and missing Vite WebSocket proxy definition.
- **Proposed Fix:** Use dynamic origin detection: `const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000')`; add `/socket.io` proxy to `vite.config.js`.
- **Regression Tests Required:** Verification of socket connection across dev proxy and simulated production URL.
- **Verification Status:** Confirmed via configuration audit.

---

### BUG-SEC-01: Internal MongoDB User ID Leakage in Message Payloads
- **Severity:** P1 (High)
- **Category:** Security / Anonymous Privacy
- **Affected File:** `hostel-community/server/services/message.service.js`, `hostel-community/server/services/notification.service.js`, `hostel-community/server/socket/chat.socket.js`, `hostel-community/server/controllers/room.controller.js`, `hostel-community/server/controllers/message.controller.js`, `hostel-community/client/src/components/MessageBubble.jsx`, `hostel-community/client/src/pages/ChatPage.jsx`
- **Status:** **Fixed & Verified**
- **Verified Root Cause:** `formatSafeMessage` unconditionally populated `sender.id = sender._id.toString()`, broadcasting the internal MongoDB primary key of every student to all other residents in chat history (`GET /api/rooms/:roomId/messages`) and Socket.IO `new_message` events. Furthermore, `room:unread_updated` events broadcast `senderId: student._id.toString()`, `safeReactions` leaked the reactor's MongoDB `user: _id` to all peers, `safeActor.id` leaked the reactor's `User._id` in notification payloads, and author multi-tab sessions in Socket.IO were susceptible to receiving peer-sanitized payloads.
- **Files Changed:**
  - `hostel-community/server/services/message.service.js`
  - `hostel-community/server/services/notification.service.js`
  - `hostel-community/server/socket/chat.socket.js`
  - `hostel-community/server/controllers/room.controller.js`
  - `hostel-community/server/controllers/message.controller.js`
  - `hostel-community/client/src/components/MessageBubble.jsx`
  - `hostel-community/client/src/pages/ChatPage.jsx`
  - `hostel-community/server/tests/privacy.test.js`
- **Exact Changes Made:**
  - **Context-Aware Message Serializer (`message.service.js`):** Updated `formatSafeMessage(msg, requestingUser)` to compute server-derived ownership (`isOwn`). `sender.id` is included *only* if `isOwn === true`. For peers, `sender.id` is omitted. Updated `reactions`: removed raw reactor `user` IDs; added server-derived `reactedByMe: true` (only for the calling user) and `userReactions: [types]`.
  - **Multi-Tab Socket Delivery & Broadcast Sanitization (`chat.socket.js`):** In `send_message`, broadcasts peer-safe payload with room exclusion `io.to(roomId).except('user:' + student._id).emit('new_message', peerMessage)` and emits author payload to `io.to('user:' + student._id)`. All author sockets receive `isOwn: true` with zero duplicates, while peers receive `isOwn: false`. In `add_reaction` and `remove_reaction`, emits `userReactions` to author sockets and peer-safe reaction counts without user IDs to room peers.
  - **REST Controller Broadcast Sanitization (`room.controller.js` & `message.controller.js`):** Broadcasts `peerMessage` via `.except('user:' + req.user._id)` and author message to `.to('user:' + req.user._id)`. Removed `senderId` from `room:unread_updated`.
  - **Notification Actor Privacy (`notification.service.js`):** Removed internal `id: actor._id` from `safeActor` in `formatSafeNotification`. Retains anonymous persona (`anonymousName`, `anonymousAvatar`, `year`) without leaking internal MongoDB primary keys.
  - **Client Reaction & Ownership Evaluation (`MessageBubble.jsx` & `ChatPage.jsx`):** Updated `hasUserReacted` to check `userReactions` and `reactedByMe: true`. Updated `ChatPage.jsx` real-time listener and optimistic toggle handlers to process `userReactions` without requiring peer user IDs.
  - **Automated Regression Suite (`server/tests/privacy.test.js`):** Added 6 focused tests (tests 5–10) covering REST history privacy, multi-tab author Socket.IO delivery, unread notification privacy, authorization preservation, reaction payload privacy in REST and Socket.IO, and notification actor privacy.
- **Commands Executed & Results:**
  1. `node --test tests/privacy.test.js`: Passed with exit code 0 (10/10 tests passed). Specifically verified:
     - REST room messages omit `sender.id` and set `isOwn: false` for peers, but provide `sender.id` and `isOwn: true` to the author.
     - Multi-tab author sockets both receive author payloads with `isOwn: true`, while peers receive peer-safe payloads without author ID, and no socket receives duplicate events.
     - `room:unread_updated` events do not leak `senderId`.
     - Reaction payloads omit reactor user IDs in REST and Socket.IO while allowing owners to add/remove reactions and denying non-owners.
     - Notification payloads omit `actor.id` and never leak actor MongoDB primary keys.
  2. `npm --prefix hostel-community/server run test`: Passed with exit code 0 across all 14 test suites (151/151 tests passed).
  3. `npm --prefix hostel-community/client run lint`: Passed with exit code 0 across 63 files (0 errors, 49 pre-existing warnings).
  4. `npm --prefix hostel-community/client run build`: Passed with exit code 0 (`vite build` compiled all 2,588 modules cleanly in 804ms).
  5. `git diff`: Inspected full diff; confirmed zero unintended changes.
- **Verification Limitations:** Live browser multi-client E2E testing relies on the automated Socket.IO client harness (`socket.io-client` in Node test runner) because no frontend browser test framework is configured in `client/package.json` (`BUG-QA-01`).

---

### BUG-SEC-02: Missing Rate Limiting on Authentication & Messages
- **Severity:** P1 (High)
- **Category:** Security / Abuse Prevention
- **Affected File:** `hostel-community/server/app.js`, `hostel-community/server/routes/auth.routes.js`, `hostel-community/server/routes/message.routes.js`
- **Reproduction Steps:**
  1. Send 100 rapid consecutive `POST` requests to `/api/auth/login` or `/api/rooms/:roomId/messages`.
- **Expected Behavior:** Rate limiting middleware intercepts abusive requests and returns `429 Too Many Requests`.
- **Actual Behavior:** No rate limiting library (`express-rate-limit`) is installed or mounted. The endpoints process unlimited requests until server resource exhaustion.
- **Root Cause:** Rate limiting was not implemented in initial server setup.
- **Proposed Fix:** Install and configure `express-rate-limit` for authentication routes (e.g., 10 requests per 15 minutes) and message posting (e.g., 30 messages per minute).
- **Regression Tests Required:** Automated rate limiter tests verifying 429 response upon threshold breach.
- **Verification Status:** Confirmed via `package.json` and `app.js` inspection.

---

### BUG-BE-03: NoSQL Injection / Type Confusion in Login Credentials
- **Severity:** P1 (High)
- **Category:** Security / Input Validation
- **Affected File:** `hostel-community/server/services/auth.service.js` (`lines 130–136`)
- **Reproduction Steps:**
  1. Send `POST /api/auth/login` with body `{ "email": { "$gt": "" }, "password": "any" }`.
- **Expected Behavior:** Input validation middleware rejects non-string types with `400 Bad Request`.
- **Actual Behavior:** The server executes `email.trim().toLowerCase()`. Since `email` is an object, JavaScript throws `TypeError: email.trim is not a function`, bubbling up to `errorHandler` as an unhandled 500 error.
- **Root Cause:** `loginStudent` checks `if (!email || !password)` for truthiness, but lacks `typeof email !== 'string' || typeof password !== 'string'` type validation (unlike `registerStudent`).
- **Proposed Fix:** Add strict type guards:
  ```javascript
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    const error = new Error('Valid email and password strings are required.');
    error.statusCode = 400;
    throw error;
  }
  ```
- **Regression Tests Required:** Unit tests asserting that non-string email/password inputs return HTTP 400.
- **Verification Status:** Confirmed via code inspection of `auth.service.js`.

---

### BUG-FE-03: Missing Role Guard in AdminAnnouncements Page
- **Severity:** P2 (Medium)
- **Category:** Frontend / Authorization UI
- **Affected File:** `hostel-community/client/src/pages/AdminAnnouncements.jsx` (`lines 23–26, 323`)
- **Reproduction Steps:**
  1. Log in as a normal student (`role: "student"`).
  2. Navigate directly in browser to `http://localhost:5173/admin/announcements`.
- **Expected Behavior:** Non-admin students should see an "Access Denied" barrier (as implemented in `AdminReports.jsx`).
- **Actual Behavior:** `AdminAnnouncements.jsx` calculates `const isAdmin = user?.role === 'admin'`, but never checks `isAdmin` in its JSX return. The entire administrative interface (forms to create announcements and polls) is rendered to student users.
- **Root Cause:** Omission of the authorization guard condition in the component render logic.
- **Proposed Fix:** Add access denial guard before main render:
  ```jsx
  if (user && user.role !== 'admin') {
    return <AccessDeniedView />;
  }
  ```
- **Regression Tests Required:** Component test verifying non-admin users cannot render admin forms.
- **Verification Status:** Confirmed via code inspection of `AdminAnnouncements.jsx`.

---

### BUG-FE-04: ProtectedRoute Missing Role-Based Restrictions
- **Severity:** P2 (Medium)
- **Category:** Frontend / Route Protection
- **Affected File:** `hostel-community/client/src/components/ProtectedRoute.jsx`, `hostel-community/client/src/App.jsx`
- **Reproduction Steps:**
  1. Inspect `ProtectedRoute.jsx` and route definitions in `App.jsx`.
- **Expected Behavior:** `ProtectedRoute` should accept an optional `requiredRole` prop (e.g. `requiredRole="admin"`) and redirect unauthorized users to `/dashboard`.
- **Actual Behavior:** `ProtectedRoute.jsx` accepts only `children` and checks `isAuthenticated`. Any authenticated student can access admin route paths directly.
- **Root Cause:** Routing abstraction does not support role-based authorization parameters.
- **Proposed Fix:** Add `requiredRole` support to `ProtectedRoute.jsx`.
- **Regression Tests Required:** Route navigation tests for student vs admin access.
- **Verification Status:** Confirmed via code inspection.

---

### BUG-BE-01: Unhandled Mongoose CastError on Malformed ObjectIds
- **Severity:** P2 (Medium)
- **Category:** Backend / Error Handling
- **Affected File:** Multiple controllers (`room.controller.js`, `message.controller.js`, `poll.controller.js`, `announcement.controller.js`, `admin.controller.js`)
- **Reproduction Steps:**
  1. Make an authenticated request: `GET /api/rooms/invalid-id/messages`.
- **Expected Behavior:** API returns `400 Bad Request` or `404 Not Found` with a clear message indicating an invalid ID format.
- **Actual Behavior:** Mongoose throws a `CastError`. Because `CastError` does not have an attached `statusCode`, controllers fallback to `error.statusCode || 500`. The server responds with `500 Internal Server Error`.
- **Root Cause:** Absence of centralized `CastError` normalization in `errorHandler.js` or ID format validation regex.
- **Proposed Fix:** Add Mongoose error normalization in `errorHandler.js`:
  ```javascript
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid resource identifier format for '${err.path}'.`, null, 400);
  }
  ```
- **Regression Tests Required:** API tests querying invalid IDs across all CRUD routes.
- **Verification Status:** Confirmed via code analysis of `errorHandler.js` and controllers.

---

### BUG-BE-02: Error Handler Ignores Service Error Status Codes
- **Severity:** P2 (Medium)
- **Category:** Backend / API Consistency
- **Affected File:** `hostel-community/server/middleware/errorHandler.js` (`lines 10–14`)
- **Reproduction Steps:**
  1. Trigger an asynchronous service error where `error.statusCode = 403` or `404` and pass to `next(err)`.
- **Expected Behavior:** Response status code reflects `err.statusCode`.
- **Actual Behavior:** `errorHandler.js` executes: `const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;`. Because `res.statusCode` defaults to 200 in Express, any error reaching `next(err)` without an explicit prior `res.status(...)` call responds with HTTP 500.
- **Root Cause:** Error handler checks only `res.statusCode` and ignores `err.statusCode` / `err.status`.
- **Proposed Fix:** Update line 11:
  ```javascript
  const statusCode = err.statusCode || err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  ```
- **Regression Tests Required:** Express error middleware unit tests with custom error status codes.
- **Verification Status:** Confirmed via code inspection of `errorHandler.js`.

---

### BUG-SEC-03: CORS Configuration Restricts Local Loopback Variants
- **Severity:** P2 (Medium)
- **Category:** Backend / Networking
- **Affected File:** `hostel-community/server/app.js` (`lines 17–21`), `hostel-community/server/socket/chat.socket.js` (`lines 20–24`)
- **Reproduction Steps:**
  1. Start server with `CLIENT_URL=http://localhost:5173`.
  2. Access frontend from `http://127.0.0.1:5173`.
- **Expected Behavior:** Both `localhost` and `127.0.0.1` origins are allowed in development.
- **Actual Behavior:** `cors({ origin: process.env.CLIENT_URL || [...] })` evaluates `process.env.CLIENT_URL` to a single string, disabling the multi-origin array fallback and blocking requests from `127.0.0.1`.
- **Root Cause:** Single string environmental assignment without parsing comma-separated lists or preserving dev loopback fallbacks.
- **Proposed Fix:** Parse origins as an array supporting both dev hosts.
- **Regression Tests Required:** Cross-origin request verification from both `localhost` and `127.0.0.1`.
- **Verification Status:** Confirmed via code analysis.

---

### BUG-SEC-04: Stateless JWT Token Lacks Revocation on Logout
- **Severity:** P2 (Medium)
- **Category:** Security / Session Lifecycle
- **Affected File:** `hostel-community/server/controllers/auth.controller.js` (`line 72`)
- **Reproduction Steps:**
  1. Log in and capture JWT token.
  2. Call `POST /api/auth/logout`.
  3. Replay the captured JWT token against `/api/auth/me`.
- **Expected Behavior:** Logged-out tokens should be invalidated immediately.
- **Actual Behavior:** Logout is purely client-side; the server returns 200 without recording invalidated tokens. The token remains valid until expiration (`7d`).
- **Root Cause:** Standard stateless JWT pattern without a token blocklist / invalidation timestamp.
- **Proposed Fix:** Store a `tokenInvalidBefore` timestamp on the `User` document, updated on logout or password change, checked during JWT verification in `requireAuth`.
- **Regression Tests Required:** Auth test asserting that replayed tokens after logout return HTTP 401.
- **Verification Status:** Confirmed via code analysis.

---

### BUG-3D-01: Oversized 3D Desk & Monitor Clipping Resident Character
- **Severity:** P2 (Medium)
- **Category:** Three.js / Scene Composition
- **Affected File:** `hostel-community/client/src/components/3d/character/HostelDeskSetup.jsx`, `CharacterCanvas.jsx`
- **Reproduction Steps:**
  1. Render `CharacterCanvas` in browser.
  2. Observe the resident character standing behind the desk workstation.
- **Expected Behavior:** Resident character stands naturally behind/alongside their study workstation with balanced proportions, clear visibility of their blue hoodie with the "319" marking, and unobstructed kinematics.
- **Actual Behavior:** The study desk is modeled at width 1.35 and depth 0.62, and positioned at `Z = 0.42` directly in front of the character (`Z = 0`). The monitor chassis (width 0.58, height 0.34) and desk structure occupy almost 45% of the total 3.38-unit camera view frustum, cutting off the character's lower torso, legs, and hands.
- **Root Cause:** Desk geometry dimensions and camera Z-offset were set without calibrating against the humanoid character's bounding volume.
- **Proposed Fix:** Adjust desk position and scale: reduce desk scale to `0.82`, adjust monitor width to `0.44`, shift desk position slightly forward/right (`[0.22, -0.82, 0.48]`) so the resident's upper body, "319" hoodie marking, and waving gestures remain fully visible without clipping.
- **Regression Tests Required:** Visual inspection across viewports.
- **Verification Status:** Confirmed by 3D spatial calculations and scene asset analysis.

---

### BUG-3D-02: 3D Backpack & Collar Accessories Detached from Skeleton
- **Severity:** P2 (Medium)
- **Category:** Three.js / Character Rigging
- **Affected File:** `hostel-community/client/src/components/3d/character/StudentCharacter.jsx` (`lines 564–578`)
- **Reproduction Steps:**
  1. Trigger walking or breathing kinematics in `StudentCharacter`.
  2. Observe the black backpack and hood collar relative to the torso.
- **Expected Behavior:** The resident's black backpack and blue hood collar should move organically with the spine and chest during breathing and walking.
- **Actual Behavior:** `StudentBackpack` and `HoodieCollarAccents` are instantiated as static children of the parent `groupRef` rather than attached to the humanoid model's `bones.Spine1` / `bones.Spine` bone nodes. When the spine rotates (`spine1RotX`, `spineRotY`), the backpack does not rotate with the upper body, resulting in floating or torso clipping.
- **Root Cause:** Accessory meshes are rendered outside the skinned mesh bone hierarchy.
- **Proposed Fix:** In `useEffect` after bone caching, attach the accessories to `bones.Spine1` using `createPortal` or Three.js `attach()`, or synchronize their rotation with `bones.Spine1.rotation` inside `useFrame`.
- **Regression Tests Required:** Kinematic animation playback verification.
- **Verification Status:** Confirmed via inspection of `StudentCharacter.jsx`.

---

### BUG-QA-01: Total Absence of Automated Frontend Tests
- **Severity:** P2 (Medium)
- **Category:** QA / Testing Infrastructure
- **Affected File:** `hostel-community/client/package.json`
- **Reproduction Steps:**
  1. Inspect `hostel-community/client/package.json`.
- **Expected Behavior:** A frontend test runner (`vitest` or `@testing-library/react`) should exist to validate UI components, state machines, and authentication guards.
- **Actual Behavior:** `package.json` contains scripts only for `dev`, `build`, `lint`, and `preview`. There are zero frontend test files (`*.test.jsx`).
- **Root Cause:** Frontend testing framework was omitted during scaffolding.
- **Proposed Fix:** Add Vitest and React Testing Library setup to test critical components (`PollCard`, `ProtectedRoute`, `JoinModal`).
- **Regression Tests Required:** Basic smoke test suite for client components.
- **Verification Status:** Confirmed via file search.

---

### BUG-FE-05: Oxlint Purity, Fast Refresh, and Unused Import Warnings
- **Severity:** P3 (Minor)
- **Category:** Code Quality / Maintenance
- **Affected File:** Multiple files (`AnnouncementCard.jsx`, `NotificationDropdown.jsx`, `MessageBubble.jsx`, `NoticeBoardModal.jsx`, `WelcomeSpeechBubble.jsx`, `HostelDeskSetup.jsx`, `Hero.jsx`)
- **Reproduction Steps:**
  1. Run `npm --prefix hostel-community/client run lint`.
- **Expected Behavior:** Clean lint execution with 0 errors and 0 actionable warnings.
- **Actual Behavior:** 4 errors (covered by BUG-FE-01) and 49 warnings including unused Lucide icons (`Sparkles`, `Shield`, `Calendar`, etc.), non-component export `REACTION_CONFIG` in `MessageBubble.jsx`, and impure `new Date()` calls inside component bodies.
- **Root Cause:** Leftover unused imports from rapid prototyping and inline date comparisons.
- **Proposed Fix:** Remove unused imports, move `REACTION_CONFIG` to a shared constants file, and wrap `Date` calculations in `useMemo` or helper utilities.
- **Verification Status:** Confirmed via Oxlint output.

---

### BUG-3D-03: Tablet Viewport Column Stacking in Hero Section
- **Severity:** P3 (Minor)
- **Category:** Responsive Layout
- **Affected File:** `hostel-community/client/src/components/Hero.jsx` (`lines 79, 151, 183`)
- **Reproduction Steps:**
  1. Resize browser window to tablet width (`768px – 1023px`).
  2. View the hero section.
- **Expected Behavior:** Clean multi-column layout or proportional height scaling for the 3D scene on tablet devices.
- **Actual Behavior:** The outer container uses `grid-cols-1 lg:grid-cols-12`. On `md` (768px+), the 3D container becomes visible (`hidden md:flex`) at a fixed height of `480px`, but because `lg:col-span` has not activated yet, all three components stack vertically in a single column, requiring excessive vertical scrolling to reach the Live Feed card.
- **Root Cause:** Grid breakpoint gap between `md` and `lg`.
- **Proposed Fix:** Add balanced tablet column layout (e.g. `md:grid-cols-2` or reduce tablet 3D canvas height to `360px`).
- **Verification Status:** Confirmed via CSS class inspection.

---

## 5. Systematic Repair Plan & Safe Execution Order

To stabilize the project without regressing existing features, security controls, or the finalized 3D resident character, repairs must be executed in four disciplined phases:

```mermaid
flowchart TD
    subgraph Wave 1: Critical Frontend & Runtime Fixes
        W1A["BUG-FE-01: Fix PollCard Rules of Hooks"] --> W1B["BUG-FE-02: Fix JoinModal data.database Child"]
        W1B --> W1C["BUG-FE-05: Clean Oxlint Errors & Unused Imports"]
    end

    subgraph Wave 2: Security & Backend Stabilization
        W2A["BUG-BE-03: Validate Login Types (NoSQL Injection)"] --> W2B["BUG-BE-02: Normalize errorHandler Status Codes"]
        W2B --> W2C["BUG-BE-01: Handle Mongoose CastError Globally"]
        W2C --> W2D["BUG-SEC-01: Conceal Internal User ID in Message Payload"]
        W2D --> W2E["BUG-SEC-03: Update Multi-Origin CORS Handling"]
        W2E --> W2F["BUG-SEC-02: Add Rate Limiter Middleware"]
    end

    subgraph Wave 3: Real-Time & Authorization Hardening
        W3A["BUG-RT-01: Add Socket Auto-Rejoin on Reconnect"] --> W3B["BUG-RT-02: Configure Dynamic Socket URL & Vite Proxy"]
        W3B --> W3C["BUG-FE-03: Add Access Denied Guard in AdminAnnouncements"]
        W3C --> W3D["BUG-FE-04: Support requiredRole in ProtectedRoute"]
        W3D --> W3E["BUG-SEC-04: Implement Token Invalidation on Logout"]
    end

    subgraph Wave 4: 3D Scene Calibration & Responsive Polishing
        W4A["BUG-3D-01: Scale & Offset Study Desk to Prevent Clipping"] --> W4B["BUG-3D-02: Attach 3D Backpack to Spine Bone Kinematics"]
        W4B --> W4C["BUG-3D-03: Polish Tablet Breakpoint Layout in Hero"]
        W4C --> W4D["BUG-QA-01: Add Vitest Baseline Smoke Tests"]
    end

    Wave 1 --> Wave 2
    Wave 2 --> Wave 3
    Wave 3 --> Wave 4
```

### Wave 1: Critical Frontend & Runtime Fixes (Zero Risk to Core Architecture)
1. **Fix `PollCard.jsx` (BUG-FE-01):** Reorganize `useState` declarations above any conditional early returns. Validated by running `oxlint`.
2. **Fix `JoinModal.jsx` (BUG-FE-02):** Change `{data?.database || 'Connected'}` to `{data?.database?.status || 'Connected'}` to resolve React 19 runtime crash.
3. **Clean Oxlint Warnings (BUG-FE-05):** Remove unused imports and isolate `REACTION_CONFIG`.

### Wave 2: Backend & Security Stabilization
1. **Sanitize Login Inputs (BUG-BE-03):** Add type checks for `typeof email === 'string'` and `typeof password === 'string'`.
2. **Normalize Error Handler (BUG-BE-02 & BUG-BE-01):** Update `errorHandler.js` to recognize `err.statusCode` and handle Mongoose `CastError` (returning 400).
3. **Protect Sender Identity Key (BUG-SEC-01):** In `formatSafeMessage`, conceal the internal MongoDB `User._id` for other peers or provide an opaque alias.
4. **CORS & Rate Limiting (BUG-SEC-03 & BUG-SEC-02):** Allow both loopback origins and add rate limiting to sensitive endpoints.

### Wave 3: Real-Time & Route Authorization Hardening
1. **Socket Reconnect State (BUG-RT-01 & BUG-RT-02):** Implement auto-rejoining in `socketService.js` and dynamic URL resolution.
2. **UI Role Guards (BUG-FE-03 & BUG-FE-04):** Add role verification in `ProtectedRoute.jsx` and an "Access Denied" view in `AdminAnnouncements.jsx`.
3. **Token Invalidation (BUG-SEC-04):** Implement `tokenInvalidBefore` timestamp check on user documents.

### Wave 4: 3D Character Scene Calibration & QA Setup
1. **Study Desk Calibration (BUG-3D-01):** Scale and position the workstation desk to prevent clipping the character's torso while strictly preserving the approved 3D model design.
2. **Backpack Bone Rigging (BUG-3D-02):** Synchronize `StudentBackpack` rotation with `bones.Spine1`.
3. **Responsive Hero Adjustments (BUG-3D-03):** Tune tablet viewport grid styling.
4. **Frontend Testing Setup (BUG-QA-01):** Add Vitest runner for regression prevention.

---

## 6. Recommended First Bug to Fix

**Recommendation:** Fix **BUG-FE-01** (`client/src/components/PollCard.jsx`) and **BUG-FE-02** (`client/src/components/JoinModal.jsx`) first.

**Rationale:**
1. **BUG-FE-01** is a hard violation of React's fundamental Rules of Hooks. It currently causes `oxlint` to exit with an error code and can crash the frontend whenever a poll card re-renders.
2. **BUG-FE-02** causes an immediate fatal crash in React 19 as soon as any visitor clicks on a room card or opens `JoinModal`.
3. Both fixes are self-contained, touch zero backend or database code, carry zero regression risk to existing features, and immediately unblock a clean frontend lint and runtime pass.

---

## 7. Audit Verification Status & Environmental Blockers

All safe checks were executed:
- **Backend Tests:** 14 suites, 145 tests executed against local MongoDB instance — 100% passing.
- **Frontend Build:** Vite production build executed — built successfully with chunk size warnings.
- **Frontend Lint:** Oxlint executed — 4 errors and 49 warnings discovered and cataloged.
- **Backend Startup:** Booted cleanly on port 5000; health endpoint queried successfully.
- **Environmental Limitations:**
  - No frontend unit test runner is currently installed in `client/package.json`, preventing automated component testing prior to runtime inspection.
  - No destructive database operations or external git pushes were executed, strictly adhering to project preservation rules.
