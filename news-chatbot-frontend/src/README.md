# News AI Chatbot - Frontend

Welcome to the official frontend repository for the News AI Chatbot. This project is a modern, responsive, and real-time web application built with React and TypeScript, designed to provide an engaging and interactive chat experience.

This application connects to a backend service to provide AI-powered responses to user queries about the latest news, leveraging WebSockets for instant communication.

---

## ✨ Features

- **Real-Time Messaging:** Instant, bidirectional communication with the backend using Socket.IO.
- **Persistent Sessions:** User conversations are maintained across page reloads and browser sessions using `localStorage`.
- **Engaging UI:** Features a dynamic typewriter effect for AI responses and a clean, modern interface.
- **Source Citations:** Displays sources for AI-generated answers to ensure credibility and allow for further reading.
- **Responsive Design:** A mobile-first approach ensures a seamless experience on any device.
- **Stateful UI:** Clear loading, typing, and error indicators provide constant feedback to the user.

---

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Real-Time Communication:** [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Styling:** [SCSS/Sass](https://sass-lang.com/)
- **Build Tool:** Create React App

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation & Setup

1.  **Clone the repository:**
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name

2.  **Install dependencies:**
    npm install

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    cp .env.example .env
    Open the `.env` file and set the base URL for your backend API and WebSocket server.

    # The base URL for the backend server (without /api)

    REACT_APP_API_BASE_URL=http://localhost:3001

4.  **Run the development server:**
    This will start the application on `http://localhost:3000`.
    npm start

5.  **Build for production:**
    This will create an optimized production build in the `build/` directory.
    npm run build

---

## 🏗️ Project Architecture

This project follows a modular, feature-oriented architecture that separates concerns, making the codebase clean, scalable, and easy to maintain.

### Folder Structure

src/
├── components/ # Dumb/Presentational UI components
├── context/ # React Context for global state (e.g., Socket.IO)
├── hooks/ # Custom hooks with business logic
├── services/ # API communication layer
├── styles/ # Global styles, variables, and mixins
└── types/ # Centralized TypeScript type definitions

### Architectural Overview

1.  **`types/` (The Constitution 📜):** This is the foundation. It defines the "shape" of all data in the application, ensuring type safety from the API layer all the way to the UI components.

2.  **`context/` (The Communication Hub 🌐):** The `SocketContext` establishes and maintains a single, persistent WebSocket connection for the entire application, making the socket instance globally available.

3.  **`services/` (The Diplomatic Corps 🔌):** The `api.ts` file handles all traditional HTTP requests with a pre-configured Axios client. It's used for actions that don't require real-time communication.

4.  **`hooks/` (The Logic Core 🧠):** This is where the application's intelligence lives.

    - `useSession`: Manages the user's identity (`sessionId`) by synchronizing with `localStorage` and the socket server.
    - `useChat`: Manages the state of a conversation, handling messages, loading states, and all real-time event listeners for a given session.

5.  **`components/` (The Building Blocks 🧩):** These are the reusable UI elements that receive data and functions from the hooks and render the interface. They are kept as "dumb" as possible, focusing only on presentation.

### Data Flow

The application follows a clear, top-down data flow:

`App.tsx` → `useSession()` → `ChatInterface` → `useChat()` → `MessageList`

1.  The root `App` component uses the **`useSession`** hook to establish a user `sessionId`.
2.  The `sessionId` is passed as a prop to the **`ChatInterface`** component.
3.  `ChatInterface` uses the **`useChat`** hook (passing the `sessionId`) to manage the conversation's state.
4.  The state from `useChat` (messages, isTyping, etc.) is passed down to presentational components like **`MessageList`** and **`MessageInput`** to be rendered.

## 🎨 Styling

The project uses **SCSS** for styling, organized for maximum scalability and maintainability.

- **`styles/_variables.scss`:** Contains all global CSS variables (colors, fonts, spacing).
- **`styles/_mixins.scss`:** Includes reusable SCSS mixins for common patterns (e.g., flexbox centering, responsive breakpoints).
- **`styles/components/`:** Each component has its own corresponding `.scss` file, ensuring styles are co-located and modular.
- **BEM Methodology:** A BEM-like naming convention (`block__element--modifier`) is used for clear, conflict-free CSS class names.
