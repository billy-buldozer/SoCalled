
<div align="center">

# SoCalled

### Your space. Your voice. Your community.

**A modern social communication platform built around real-time conversations, communities and content sharing.**

![Status](https://img.shields.io/badge/status-in_development-58d68d?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776ab?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)

*Connect. Communicate. Create.*

</div>

---

## 🌿 About SoCalled

**SoCalled** is an evolving social communication platform designed to bring real-time messaging and social interactions together in one place.

The idea is simple: create a space where people can join communities, exchange messages, share media and express themselves through posts.

The application combines a responsive React interface with a Python backend, using WebSockets for real-time chat communication.

Originally developed as part of an **Operating Systems project**, SoCalled also explores practical aspects of concurrent connections, asynchronous communication, shared state and client-server architecture.

The project is currently under active development.

## ✨ Features

### 💬 Real-Time Chat

- Instant messaging powered by WebSockets.
- Multiple chat rooms with independent conversations.
- Message editing and deletion.
- Replies and message forwarding between rooms.
- Emoji reactions and double-tap ❤️ interactions.
- Typing indicators and online presence.
- Automatic reconnection after connection interruptions.

### 🏠 Communities & Rooms

- Create and customize chat rooms.
- Change room names, descriptions, topics and icons.
- Upload custom room images.
- View room members and their online status.
- Room-specific nicknames.
- Owner, moderator and member roles.
- Basic message moderation.

Private room labels are currently experimental and do not provide access control.

### 📸 Media Sharing

- Send photos directly in conversations.
- Share MP4, WebM and MOV videos.
- Watch videos using the built-in player.
- Download shared media.
- Add captions to photos and videos.
- Reply to and forward messages containing media.

Video playback depends on browser codec support.

### 📰 Social Feed

SoCalled is growing beyond traditional messaging.

The first version of the social feed includes:

- Creating text posts.
- Attaching images to posts.
- Chronological post feed.
- Post likes.
- Deleting your own posts.
- Synchronization across connected devices.

Additional social features are planned for future releases.

### 📱 Responsive Experience

SoCalled is designed for both desktop and mobile browsers.

- Desktop interface with a hexagonal room navigation layout.
- Mobile-friendly chat and room selection.
- Touch gestures and responsive components.
- Access from devices connected to the same local network.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, TypeScript, Vite |
| UI | CSS, Lucide Icons |
| Backend | Python, FastAPI |
| Real-time communication | WebSockets |
| HTTP API | REST endpoints |
| Concurrency | Python asyncio |
| Current feed storage | JSON files and local media storage |
| Database infrastructure | PostgreSQL 17, Docker Compose |
| Database tooling | SQLAlchemy, Alembic |

PostgreSQL infrastructure is included in the repository, but the current chat implementation primarily uses in-memory state, while posts are stored locally.

---

## 🧩 Architecture

SoCalled follows a client-server architecture.

```text
                  ┌───────────────────┐
                  │      SoCalled     │
                  │   React Frontend  │
                  └─────────┬─────────┘
                            │
                 HTTP API / WebSockets
                            │
                  ┌─────────▼─────────┐
                  │   FastAPI Server  │
                  │     Python        │
                  └─────────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         Chat Rooms      Social Feed     Media
         WebSockets      REST API        HTTP
              │             │             │
         In-memory      JSON Storage    Local Files
```

### Real-Time Communication

Chat messages are exchanged through WebSocket connections.

The backend manages connected clients, room membership, message events and presence updates using asynchronous Python code.

This allows multiple clients to communicate without requiring a new HTTP request for every chat message.

### Social Feed

The feed currently uses a REST API for creating, retrieving, liking and deleting posts.

Clients periodically refresh the feed to display content published from other devices.

---

## 📂 Project Structure

```text
SoCalled/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── posts.py
│   │   └── video_uploads.py
│   ├── requirements.txt
│   ├── data/
│   └── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── App.tsx
│   │   └── posts.css
│   ├── package.json
│   └── vite.config.ts
│
├── compose.yaml
├── .env.example
├── alembic.ini
└── README.md
```

Some runtime directories, such as `data` and `uploads`, are created automatically when needed.

---

## 🚀 Getting Started

The following instructions describe the current local development setup on Windows.

### Prerequisites

Make sure you have installed:

- Python 3
- Node.js and npm
- Git

Docker Desktop is optional for the current chat and feed prototype.

### 1. Clone the Repository

```powershell
git clone https://github.com/billy-buldozer/SoCalled.git
cd SoCalled
```

### 2. Configure the Backend

Create a Python virtual environment:

```powershell
py -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
python -m pip install -r backend/requirements.txt
```

Start the FastAPI development server from the repository root:

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 3. Configure the Frontend

Open a second terminal in the repository root.

Install the root dependencies and the frontend dependencies:

```powershell
npm install
cd frontend
npm install
```

Start Vite:

```powershell
npm run dev
```

Open the application:

```text
http://localhost:5173
```

### 4. Access from a Phone

To test SoCalled on a mobile device:

1. Connect the phone and computer to the same local network.
2. Find the computer's local IPv4 address using `ipconfig`.
3. Open the following address in the phone's browser:

```text
http://YOUR_LOCAL_IP:5173
```

For example:

```text
http://192.168.1.100:5173
```

Replace the example IP with your computer's actual local address.

The backend must also be running, and the operating system's firewall must allow the required connections.

The current development setup uses HTTP and is intended for local testing.

---

## 🗄️ Data Storage

The project currently uses a combination of temporary and persistent local storage.

| Data | Current storage |
|------|-----------------|
| Chat messages | Server memory |
| Room information | Server memory |
| Member presence | Server memory |
| Posts and likes | Local JSON file |
| Post images | Local filesystem |
| Chat videos | Local filesystem |

**Important:** In-memory chat data is lost when the backend process restarts.

Post data is stored in `backend/data/posts.json`, while uploaded media is stored in the backend's upload directories.

A PostgreSQL-based persistence layer is a planned improvement for the messaging and social systems.

The repository already includes Docker Compose configuration for PostgreSQL development.

---

## 🧠 Technical Challenges

SoCalled is also a practical exploration of operating system and distributed application concepts.

Key technical areas include:

- Handling multiple simultaneous client connections.
- Asynchronous I/O and non-blocking communication.
- Synchronization of shared server state.
- Coordinating message broadcasts.
- Managing disconnections and reconnections.
- Processing media uploads without sending large videos through WebSockets.
- Separating frontend state management from UI components.

These challenges help connect theoretical concepts with real application development.

---

## 🗺️ Roadmap

SoCalled is an ongoing project. Planned improvements include:

- [x] Real-time chat rooms
- [x] Message replies, editing and deletion
- [x] Emoji reactions
- [x] Image sharing
- [x] Video sharing and playback
- [x] Room customization and moderation
- [x] Responsive mobile interface
- [x] Basic social feed
- [x] Post likes and image attachments
- [ ] User registration and secure authentication
- [ ] Persistent chat history
- [ ] Full PostgreSQL integration
- [ ] Comments and discussions under posts
- [ ] Video posts
- [ ] User profiles and avatars
- [ ] Notifications
- [ ] Improved media management
- [ ] Secure private communities
- [ ] Production deployment

The roadmap may change as the project evolves.

---

## 🔒 Security & Development Status

> [!WARNING]
> SoCalled is currently an experimental development project and is **not production-ready**.

The current version uses temporary browser-generated client identifiers rather than secure user authentication.

Some authorization checks rely on client-provided identifiers, and private rooms are not yet protected by access-control mechanisms.

The application should not be exposed publicly without implementing proper authentication, authorization, upload protections and additional security measures.

Uploaded user content, environment files and local application data should not be committed to the repository.

---

## 💚 Project Philosophy

SoCalled is built around a simple idea:

**Communication should feel natural, immediate and personal.**

The goal is to gradually develop a platform that combines the simplicity of instant messaging with the expressive possibilities of a social network.

Every new feature is another step toward that vision.

---

<div align="center">

### SoCalled

**Your space. Your voice. Your community.**

Built with React, TypeScript, Python and FastAPI.

*Made with curiosity, code and a lot of coffee.* ☕

</div>
