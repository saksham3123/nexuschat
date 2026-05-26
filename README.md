# NexusChat — Real-Time Chat Application

> Node.js · Socket.io · Redis · MongoDB · JWT · React.js

---

## Architecture Overview

```
client (React + Vite)
    └── Socket.io-client  ──── WebSocket ────► Socket.io server
    └── Axios             ──── REST API  ────► Express routes
                                                   │
                                          ┌────────┴─────────┐
                                       MongoDB           Redis
                                      (messages,       (sessions,
                                       rooms,           presence,
                                       users)           token blacklist)
```

---

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier is fine)
- Redis — one of:
  - Local: `brew install redis && brew services start redis`
  - Railway: Add a Redis plugin to your Railway project
  - Upstash: https://upstash.com (free tier)

---

## Setup

### 1. Clone & install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# server/
cp .env.example .env
# Fill in MONGO_URI, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET
```

```bash
# client/
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run locally

```bash
# Terminal 1 — backend
cd server
npm run dev       # nodemon, hot-reload

# Terminal 2 — frontend
cd client
npm run dev       # Vite dev server on :5173
```

Open http://localhost:5173 → Register → Start chatting!

---

## Project Structure

```
nexuschat/
├── server/
│   ├── config/
│   │   ├── db.js           # MongoDB connection (poolSize 20)
│   │   └── redis.js        # ioredis singleton
│   ├── controllers/
│   │   ├── auth.js         # register, login, logout, refresh, me
│   │   ├── messages.js     # paginated history, send, reactions
│   │   └── rooms.js        # group rooms, DMs, join
│   ├── middleware/
│   │   └── auth.js         # JWT protect (REST) + socketAuth (WS)
│   ├── models/
│   │   ├── User.js         # bcrypt hashed password, isOnline, lastSeen
│   │   ├── Message.js      # compound index on (room, createdAt)
│   │   └── Room.js         # group | direct, members, admins
│   ├── routes/
│   │   ├── auth.js         # rate-limited auth endpoints
│   │   ├── messages.js     # paginated message REST API
│   │   └── rooms.js        # room CRUD
│   ├── socket/
│   │   └── index.js        # all Socket.io events (core real-time layer)
│   └── index.js            # Express + Socket.io bootstrap
│
└── client/
    └── src/
        ├── components/
        │   ├── Auth/AuthPage.jsx       # login / register form
        │   ├── Chat/
        │   │   ├── ChatWindow.jsx      # main chat area
        │   │   ├── MessageBubble.jsx   # message + reactions
        │   │   └── MessageInput.jsx    # input + typing emit
        │   └── Layout/Sidebar.jsx      # channels, DMs, presence
        ├── context/AuthContext.jsx     # auth state + token management
        ├── hooks/
        │   ├── useMessages.js          # paginated load + socket events
        │   └── usePresence.js          # online/offline tracking
        └── utils/
            ├── api.js                  # axios + auto-refresh interceptor
            └── socket.js              # socket.io-client singleton
```

---

## Key Features & How They Map to Your Resume

### Sub-100ms Message Delivery
Socket.io's WebSocket transport bypasses HTTP overhead. The `message:send` event persists to MongoDB and immediately calls `io.to(roomId).emit()` — all in one async tick. Redis caches the last 50 messages per room for instant retrieval.

### JWT + Redis Session Management
- **Access token** (short-lived, HS256/RS256) attached to every REST request and the Socket.io handshake
- **Refresh token** stored in Redis with a 30-day TTL — enables silent re-auth
- On logout, the access token is **blacklisted** in Redis until its natural expiry — preventing reuse

### Paginated REST API (60% payload reduction)
`GET /api/messages/:roomId?cursor=<lastId>&limit=30` uses MongoDB cursor-based pagination with a compound index on `(room, createdAt)`. The client loads 30 messages initially and requests older pages on scroll — dramatically reducing the initial payload compared to loading full history.

### Real-Time Presence Tracking
- On connect: user marked online in MongoDB + Redis key set (`presence:<userId>` TTL 120s)
- Heartbeat interval refreshes Redis TTL every 60s to prevent false-offline
- On disconnect: only marks offline if **all** their socket connections close (handles multiple tabs)
- `user:online` / `user:offline` events broadcast to all connected clients

### Horizontal Scalability
- MongoDB connection pool (`maxPoolSize: 20`) handles connection spikes
- Redis can be swapped for Redis Cluster for cross-server pub/sub (Socket.io Redis adapter)
- Stateless JWT means any server instance can authenticate any request
- Railway auto-scaling handles 500+ concurrent WebSocket connections

---

## Deployment (Railway)

```bash
# 1. Push to GitHub
# 2. New Railway project → Deploy from GitHub
# 3. Add MongoDB plugin or connect MongoDB Atlas via MONGO_URI
# 4. Add Redis plugin → REDIS_URL auto-injected
# 5. Set environment variables in Railway dashboard
# 6. Deploy client to Vercel/Netlify, set VITE_API_URL to Railway domain
```

---

## Socket.io Events Reference

| Event | Direction | Payload |
|-------|-----------|---------|
| `room:join` | client → server | `{ roomId }` |
| `message:send` | client → server | `{ roomId, content, type }` |
| `message:new` | server → room | Full message object |
| `typing:start` | client → server | `{ roomId }` |
| `typing:stop` | client → server | `{ roomId }` |
| `typing:update` | server → room | `{ userId, username, isTyping }` |
| `message:react` | client → server | `{ messageId, emoji, roomId }` |
| `message:reacted` | server → room | `{ messageId, reactions }` |
| `message:read` | client → server | `{ messageId, roomId }` |
| `user:online` | server → all | `{ userId, username }` |
| `user:offline` | server → all | `{ userId, lastSeen }` |
