# 🤖 News Chatbot Frontend

A modern, real-time chat interface built with **React, TypeScript, and Socket.IO** that delivers an engaging conversational experience with an AI-powered news assistant. Think of it as having a **friendly news expert right in your browser** who's always ready to chat about current events!

## ✨ What This Does

This frontend application provides:

- 💬 **Real-time Chat Interface** - Instant messaging with typing indicators
- 🤖 **AI Conversation** - Smart responses about news and current events
- 📱 **Responsive Design** - Works beautifully on desktop and mobile
- ⚡ **Socket.IO Integration** - Lightning-fast real-time communication
- 💾 **Session Persistence** - Remembers your conversation history
- 🎨 **Modern SCSS Styling** - Clean, professional appearance

## 🎯 Key Features

### Real-Time Experience

- ⌨️ **Live typing indicators** when the AI is thinking
- 📨 **Instant message delivery** via WebSocket
- 🔄 **Automatic reconnection** if connection drops
- 💬 **Typewriter effect** for AI responses

### Smart Conversation Management

- 🎭 **Persistent sessions** across browser refreshes
- 📚 **Full chat history** preservation
- 🗑️ **Easy conversation reset** with one click
- 🔍 **Source citations** for news responses

### Developer-Friendly Architecture

- 📦 **Component-based** React architecture
- 🔒 **TypeScript** for type safety
- 🎨 **SCSS modules** for organized styling
- 🪝 **Custom hooks** for state management

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- Running backend server (see backend README)

### 1. Clone & Install

git clone <your-repo-url>
cd news-chatbot-frontend

### 2. Environment Setup

Create a `.env` file:
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URLhttp://localhost:3001

### 3. Start Development Server

npm run dev

Your chat interface will be available at `http://localhost:5173`

## 🏗️ Project Structure

```bash
frontend/
├── src/
│   ├── components/          # React UI components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── context/             # React Context providers
│   │   └── SocketContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useChat.ts
│   │   └── useSession.ts
│   ├── services/            # API communication
│   │   └── api.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── utils/               # Helper functions
│   │   └── sessionUtils.ts
│   ├── styles/              # SCSS styling
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   ├── _backgrounds.scss
│   │   ├── App.scss
│   │   └── components/      # Component-specific styles
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── package.json             # Dependencies & scripts

## 🎨 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Real-time Communication**: Socket.IO Client
- **Styling**: SCSS with component modules
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State Management**: React Hooks + Context

## 🔄 How It Works

### The Chat Flow

👤 User types message
↓ 2. 📨 Send via Socket

to backend

⌨️ Show "AI is thinking..." indicator

🤖 Receive AI response via Socket.IO

✨ Display with typewriter effect

📚 Show news sources if available

### Session Management

🆔 Generate unique session ID
↓ 2. 💾

🔌 Connect to Socket.IO room

📚 Load conversation history

💬 Ready for real-time chat!

## 🛠️ Available Scripts

Development
npm run dev # Start development server
npm run build # Build for production

Code Quality
npm run lint # Run ESLint
npm run

## 🧩 Component Overview

### 💬 ChatInterface

_"The main stage where conversations come to life"_

- Orchestrates the entire chat experience
- Manages message display and input
- Handles session reset functionality

### 📝 MessageList

_"The conversation history keeper with style"_

- Displays chat messages with proper formatting
- Implements typewriter effect for AI responses
- Shows source citations and timestamps

### ⌨️ MessageInput

_"The smart text box that understands you"_

- Auto-resizing textarea for comfortable typing
- Enter-to-send with Shift+Enter for new lines
- Loading states and input validation

### 🤖 TypingIndicator

_"The visual cue that AI is working hard"_

- Animated dots showing AI is processing
- Smooth appearance/disappearance transitions

## 🎨 SCSS Architecture

Our styling follows a modular approach:

// Core styling foundation
styles/
├── \_variables.scss # Colors, fonts, breakpoints
├── \_mixins.scss # Reusable style patterns
├── \_backgrounds.scss # Background patterns & gradients
├── App.scss # Global application styles
└── components/ # Component-specific styles
├── chat-interface.scss
├── message-list.scss
├── message-input.scss
├── typing-indicator.scss

### Design System

- 🎨 **Modern color palette** with dark/light theme support
- 📱 **Mobile-first responsive design**
- ✨ **Smooth animations** and transitions
- 🔤 **Typography hierarchy** for readability

## 🔌 Real-Time Features

### Socket.IO Events

// Outgoing events (to server)
'join-session' // Connect to chat room
'chat-message' // Send user message
// Incoming events (from server)
'session-history' // Load past messages
'message-added' // New message received
'bot-typing' // AI thinking status

### Connection Management

- 🔄 **Auto-reconnection** on network issues
- ⚡ **Connection status** indicators
- 🛡️ **Error handling** with user feedback

## 📱 Responsive Design

The interface adapts beautifully across devices:

- **Desktop** (1200px+): Full sidebar layout with spacious messaging
- **Tablet** (768px-1199px): Compact layout with touch-friendly controls
- **Mobile** (320px-767px): Single-column design optimized for thumbs

## 🎯 Best Practices Implemented

### TypeScript Integration

// Strong typing for all props and state
interface ChatMessage {
id: string; role: 'user' | 'assistant'; content: string; timestamp: string; sources?: string[];}

### React Performance

- ⚡ **useCallback** for stable function references
- 🎯 **useMemo** for expensive calculations
- 🔄 **useEffect** cleanup for memory management
- 📦 **Component splitting** for code organization

### Error Boundaries

- 🛡️ **Graceful error handling** at component level
- 📝 **User-friendly error messages**
- 🔄 **Recovery mechanisms** for network issues

## 🐛 Troubleshooting

### Common Issues

**Socket connection fails:**
Check backend server is running
curl http://localhost:3001/api/health

Verify environment variables
echo $VITE_SOCKET_URL

**Messages not appearing:**

- Check browser console for WebSocket errors
- Verify session ID is consistent
- Test with backend health endpoint

**Styling issues:**

- Clear browser cache and restart dev server
- Check SCSS compilation in terminal
- Verify all imports are correct

### Debug Mode

Enable detailed logging:
// Add to main.tsx for development
if (import.meta.env.DEV) {
console.log('🔍 Debug mode enabled');
}

## 🚀 Production Deployment

### Build Optimization

npm run build

### Environment Variables

Production settings
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URLhttps://your-backend-domain.com

### Performance Features

- 📦 **Code splitting** for faster initial loads
- 🗜️ **Asset optimization** via Vite
- 💾 **Browser caching** for static resources

**Ready to chat?**
Start your development server and begin conversing with your AI
