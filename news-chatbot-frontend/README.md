# 🤖 News Chatbot Frontend

A modern, real-time chat interface built with **React, TypeScript, and Socket.IO** that delivers an engaging conversational experience with an AI-powered news assistant.

Think of it as having a **friendly news expert right in your browser** who's always ready to chat about current events!

***

## ✨ What This Does

This frontend application provides:

- 💬 **Real-time Chat Interface** – Instant messaging with typing indicators
- 🤖 **AI Conversation** – Smart responses about news and current events
- 📱 **Responsive Design** – Works beautifully on desktop and mobile
- ⚡ **Socket.IO Integration** – Lightning-fast real-time communication
- 💾 **Session Persistence** – Remembers your conversation history
- 🎨 **Modern SCSS Styling** – Clean, professional appearance

***

## 🎯 Key Features

### 🔴 Real-Time Experience
- ⌨️ Live typing indicators when the AI is thinking
- 📨 Instant message delivery via WebSocket
- 🔄 Automatic reconnection if connection drops
- 💬 Typewriter effect for AI responses

### 🧠 Smart Conversation Management
- 🎭 Persistent sessions across browser refreshes
- 📚 Full chat history preservation
- 🗑️ One-click conversation reset
- 🔍 Source citations for news responses

### 👨‍💻 Developer-Friendly Architecture
- 📦 Component-based React architecture
- 🔒 TypeScript type safety
- 🎨 SCSS modules for organized styling
- 🪝 Custom hooks for state management

***

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- NPM or Yarn
- Running backend server (see backend README)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd news-chatbot-frontend
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Start Development Server
```bash
npm run dev
```

👉 Your chat interface will be available at `http://localhost:5173`

***

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/            # Reusable React UI components
│   │   ├── ChatInterface.tsx  # Main chat container
│   │   ├── MessageList.tsx    # Displays chat history
│   │   ├── MessageInput.tsx   # User input field
│   │   └── TypingIndicator.tsx# AI typing animation
│   │
│   ├── context/               # Global state providers
│   │   └── SocketContext.tsx  # WebSocket context
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChat.ts         # Chat state & logic
│   │   └── useSession.ts      # Session persistence
│   │
│   ├── services/              # API communication layer
│   │   └── api.ts             # Axios-based requests
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/                 # Helper utilities
│   │   └── sessionUtils.ts    # Session handling helpers
│   │
│   ├── styles/                # Global & modular SCSS styles
│   │   ├── _variables.scss    # Theme variables
│   │   ├── _mixins.scss       # Reusable style patterns
│   │   ├── _backgrounds.scss  # Background effects
│   │   ├── App.scss           # Root styles
│   │   └── components/        # Component-specific styles
│   │
│   ├── App.tsx                # Root React component
│   └── main.tsx               # Application entry point
│
├── index.html                 # Base HTML template
├── package.json               # Project metadata & scripts
└── README.md                  # This file
```

***

## 🎨 Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Real-time Communication:** Socket.IO Client
- **Styling:** SCSS with component modules
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **State Management:** React Hooks + Context

***

## 🔄 How It Works

### 📡 Chat Flow
1. 👤 **User types a message**
2. 📨 Sent via **Socket.IO** to backend
3. ⌨️ Show **"AI is thinking…"** indicator
4. 🤖 Receive **AI response** via Socket.IO
5. ✨ Display with **typewriter effect**
6. 📚 Show **sources** if available

### 💾 Session Management
1. 🆔 Generate **unique session ID**
2. 🔌 Connect to **Socket.IO room**
3. 📚 Load **conversation history**
4. 💬 Ready for **real-time chat**

***

## 🛠️ Available Scripts

### Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
```

### Code Quality
```bash
npm run lint   # Run ESLint
```

***

## 🧩 Component Overview

### 💬 ChatInterface
- Orchestrates chat flow
- Manages messages & input
- Handles session reset

### 📝 MessageList
- Displays chat history
- Typewriter effect for AI
- Shows sources & timestamps

### ⌨️ MessageInput
- Auto-resizing textarea
- Enter-to-send (Shift+Enter = new line)
- Input validation & loading states

### 🤖 TypingIndicator
- Animated dots while AI is typing
- Smooth transitions on/off

***

## 🎨 SCSS Architecture

```
styles/
├── _variables.scss     # Colors, fonts, breakpoints
├── _mixins.scss        # Reusable patterns
├── _backgrounds.scss   # Background gradients & patterns
├── App.scss            # Global styles
└── components/         # Component-specific styles
    ├── chat-interface.scss
    ├── message-list.scss
    ├── message-input.scss
    └── typing-indicator.scss
```

### ✨ Design System
- 🎨 Modern color palette (dark/light mode)
- 📱 Mobile-first responsive design
- 🔤 Clear typography hierarchy
- 🌀 Smooth animations & transitions

***

## 🔌 Real-Time Features

### 📡 Socket.IO Events

**Outgoing:**
- `join-session` → Connect to chat room
- `chat-message` → Send user message

**Incoming:**
- `session-history` → Load past messages
- `message-added` → Receive new message
- `bot-typing` → AI thinking status

### ⚙️ Connection Management
- 🔄 Auto-reconnection
- ⚡ Connection status indicators
- 🛡️ Error handling & user feedback

***

## 📱 Responsive Design

- **Desktop (1200px+)** → Full layout with sidebar
- **Tablet (768px–1199px)** → Compact layout
- **Mobile (320px–767px)** → Single-column, thumb-friendly

***

## 🎯 Best Practices

- ✅ Strong typing with TypeScript
- ✅ Performance hooks: `useCallback`, `useMemo`
- ✅ Cleanup with `useEffect`
- ✅ Error boundaries for resilience

***

## 🐛 Troubleshooting

### Common Issues

**❌ Socket connection fails**

Check backend server:
```bash
curl http://localhost:3001/api/health
```

Verify env variables:
```bash
echo $VITE_SOCKET_URL
```

**❌ Messages not showing**
- Check browser console for WebSocket errors
- Verify session ID consistency

**❌ Styling broken**
- Clear browser cache
- Restart dev server
- Check SCSS imports

### 🔍 Debug Mode
```javascript
if (import.meta.env.DEV) {
  console.log("🔍 Debug mode enabled");
}
```

***

## 🚀 Production Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
```

### Optimizations
- 📦 Code splitting
- 🗜️ Asset optimization
- 💾 Browser caching

***

## ✅ Ready to Chat?

Start your dev server and begin conversing with your AI-powered news assistant! 🎉
