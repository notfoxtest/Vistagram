# EchoSphere - Discord-Style Communication Platform

## Project Overview
EchoSphere is a real-time communication platform with Discord-style UX and a modern Liquid Glass aesthetic. Built with FastAPI + React + MongoDB.

## Architecture

### Backend (FastAPI)
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: MongoDB with motor async driver
- **Real-time**: Socket.io for WebSocket events (optional, HTTP fallback available)
- **API Prefix**: All routes use `/api` prefix

### Frontend (React)
- **State Management**: React Context (AuthContext, AppContext, SocketContext)
- **UI Framework**: TailwindCSS + Shadcn/UI components
- **Animations**: Framer Motion
- **Theme**: Liquid Glass dark mode aesthetic

### Data Models
- **Users**: id, username, email, password, avatar, banner, bio, status, is_nitro, discriminator
- **Servers**: id, name, icon, banner, description, owner_id, members, invite_code, boost_count
- **Channels**: id, name, channel_type (text/voice/video/announcement), server_id, category_id
- **Messages**: id, content, channel_id, author_id, attachments, reactions, is_pinned
- **DMs**: id, participants, is_group
- **Roles**: id, name, server_id, color, permissions, position

## Features Implemented

### Core Features
- [x] User Authentication (Signup/Login with JWT)
- [x] Server Creation and Management
- [x] Text Channels with Real-time Messaging
- [x] Voice/Video Channels (UI mockup)
- [x] Direct Messages (1:1)
- [x] User Profiles with Customization
- [x] Server Discovery
- [x] Role System (basic)

### UI/UX Features
- [x] 3-Column Discord Layout
- [x] Liquid Glass Aesthetic
- [x] Message Reactions
- [x] Typing Indicators (socket-based)
- [x] User Presence (online/offline)
- [x] Nitro Subscription UI (mocked)
- [x] Settings Modal
- [x] Toast Notifications

## API Endpoints

### Auth
- POST `/api/auth/signup` - Create account
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile

### Servers
- GET `/api/servers` - Get user's servers
- POST `/api/servers` - Create server
- GET `/api/servers/{id}` - Get server details
- POST `/api/servers/join/{invite}` - Join server
- GET `/api/servers/{id}/members` - Get server members
- GET `/api/servers/{id}/channels` - Get server channels

### Messages
- POST `/api/messages` - Send message
- GET `/api/channels/{id}/messages` - Get channel messages
- PUT `/api/messages/{id}` - Edit message
- DELETE `/api/messages/{id}` - Delete message
- POST `/api/messages/{id}/reactions/{emoji}` - Add reaction

### DMs
- POST `/api/dms` - Create DM
- GET `/api/dms` - Get user's DMs
- POST `/api/dms/messages` - Send DM message
- GET `/api/dms/{id}/messages` - Get DM messages

## Next Action Items

### Phase 2 - Enhanced Features
1. **Group DMs** - Multi-user private conversations
2. **Server Events** - Scheduled events with RSVP
3. **Server Boosting** - Visual upgrades for boosted servers
4. **Message Search** - Full-text search across messages
5. **File Uploads** - Image, video, document sharing
6. **Pinned Messages** - Pin important messages
7. **Message Threads** - Reply threads

### Phase 3 - Real-time Enhancements
1. **WebRTC Voice** - Actual voice calling
2. **WebRTC Video** - Video calling & screen share
3. **Push Notifications** - Browser notifications
4. **Message Sync** - Offline message queue

### Phase 4 - Administration
1. **Moderation Tools** - Kick/ban/mute users
2. **Audit Logs** - Server activity logs
3. **Custom Permissions** - Granular role permissions
4. **Server Settings** - Full server configuration

## Environment Variables

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
JWT_SECRET="your-secret-key"
CORS_ORIGINS="*"
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor, Socket.io, JWT, bcrypt
- **Frontend**: React 19, TailwindCSS, Shadcn/UI, Framer Motion, Socket.io-client
- **Fonts**: Outfit (headings), Satoshi (body), JetBrains Mono (code)
