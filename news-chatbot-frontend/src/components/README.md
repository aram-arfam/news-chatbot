# 🧩 /src/components - The UI Building Blocks

Welcome to your **component workshop**! Think of this folder as a **master craftsman's studio** where each component is a carefully crafted tool designed for a specific purpose. Together, they create a seamless, engaging chat experience.

## 📁 Component Gallery

components/
├── 💬 ChatInterface.tsx # The main conversation orchestrator
├── 📝 MessageList.tsx # The conversation history display
├── ⌨️ MessageInput.tsx # The smart text input system
└── 🤖 TypingIndicator.tsx # The visual storyteller who shows the AI is working hard

## 🎭 Meet Your UI Team

### 💬 `ChatInterface.tsx` - The Stage Director

_"The conductor who orchestrates the entire conversation experience"_

This is your **main stage** where the magic happens. It's like the **director of a live theater show** - coordinating all the actors (other components) to create a seamless performance.

**Key Responsibilities:**

- 🎬 **Orchestrates the chat flow** between user input and message display.
- 🔄 **Manages session reset** functionality by connecting to the parent state.
- 🛡️ **Handles and displays error states** with user-friendly, dismissible messages.
- 🎨 **Provides the main layout structure** for the header, message list, and input area.

**Features:**

- **Smart Error Handling:** Displays a dismissible alert to the user when an API call fails, ensuring the UI remains usable.
- **Clean Session Reset:** Provides a one-click button to clear the conversation history and start a new session.

**When to modify:**

- Adding new top-level chat features (e.g., voice input, file uploads).
- Changing the overall layout structure of the chat window.
- Implementing new global error handling patterns.
- Adding global chat controls to the header.

### 📝 `MessageList.tsx` - The Story Keeper

_"The master storyteller who brings conversations to life"_

This component is like a **skilled narrator** who not only displays the conversation but makes it engaging with animations, formatting, and helpful context.

**Key Responsibilities:**

- 📚 **Displays conversation history** with distinct styling for user and AI messages.
- ✨ **Animates AI responses** with a typewriter effect to feel more interactive.
- 📰 **Renders source citations** for news-based responses, adding credibility.
- 📱 **Auto-scrolls** the view to keep the latest messages visible.
- 🕐 **Formats timestamps** to provide clear context for each message.

**Special Features:**

- **Typewriter Effect Magic:** AI messages are "typed" out character-by-character, creating a dynamic and engaging user experience.
- **Smart Source Display:** After a message is fully streamed, it cleanly displays related news sources with titles and relevance scores.
- **Welcome Experience:**
  - 👋 Greets new users with a friendly welcome message when the conversation is empty.
  - 💡 Provides suggested questions to help users get started.
  - 🎯 Sets clear expectations about what the AI can do.

### ⌨️ `MessageInput.tsx` - The Smart Communicator

_"The intelligent assistant who makes typing a pleasure"_

This isn't just a text box; it's a smart communication interface that adapts to user behavior and provides a fluid typing experience.

**Key Responsibilities:**

- ⌨️ **Auto-resizes the textarea**, growing and shrinking dynamically with content.
- 🚀 **Handles message submission** via an intuitive "Enter-to-send" (with Shift+Enter for new lines) and a click button.
- 🔒 **Manages input state** and prevents the submission of empty messages.
- ⏳ **Displays loading states** on the send button during message processing.

**User Experience Details:**

- 🎯 **Smart placeholder text** guides users on what to ask.
- 🚫 **Disables submission** for empty inputs to prevent accidental sends.
- ⏳ **Visual loading states** with emoji indicators (⏳) provide clear feedback.
- 🔄 **Clears the input field** after a message is successfully sent.

### 🤖 `TypingIndicator.tsx` - The Anticipation Builder

_"The visual storyteller who shows the AI is working hard"_

This small but mighty component creates anticipation and engagement by visually confirming that the AI is processing a request, similar to modern messaging apps.

**Key Responsibilities:**

- ⏳ **Provides visual feedback** to the user while they wait for a response.
- ✨ **Uses smooth, subtle animations** that feel natural and non-intrusive.
- 🎨 **Maintains a consistent style** with the overall chat design.
- 📱 **Behaves responsively** across all screen sizes.

## 🎨 Styling Architecture

Each component has its own dedicated SCSS file located in `/styles/components/` for clean, modular styling.

// Component-specific styles
styles/components/
├── chat-interface.scss # Main layout and orchestration
├── message-list.scss # Message bubbles, animations, and sources
├── message-input.scss # Input field, button, and loading states
└── typing-indicator.scss # Dot animation and layout

## 🔄 Component Communication

### Props Flow

App.tsx
↓ (sessionId, onResetSession)
ChatInterface.tsx
↓ (onSendMessage, isLoading)  
MessageInput.tsx  
↓ (messages, isTyping)
MessageList.tsx
└── Renders `TypingIndicator` when `isTyping` is true.

### Event Flow

1.  User types a message in `MessageInput` and submits the form.
2.  `MessageInput` calls the `onSendMessage` function passed down from `ChatInterface`.
3.  `ChatInterface` processes the message via its `useChat` hook, which handles the API call.
4.  The `useChat` hook updates the state (`messages`, `isTyping`, `isLoading`).
5.  State updates flow down to `MessageList` and `MessageInput`, causing them to re-render with the new information.
6.  `TypingIndicator` is shown or hidden inside `MessageList` based on the `isTyping` state.

## 🎯 Best Practices

### Component Design Principles

- ✅ **Single Responsibility:** Each component has one clear, well-defined purpose.
- ✅ **Explicit Props Interface:** Props are clearly defined in `types.ts`, ensuring type safety and predictability.
- ✅ **State Colocation:** State is managed by the most logical parent component (`ChatInterface` via the `useChat` hook) and passed down as props.

### Performance Optimization

- ✅ **Stable Callbacks:** Functions like `onSendMessage` originate from the `useChat` hook, ensuring they are stable and preventing unnecessary re-renders in `MessageInput`.
- ✅ **Semantic HTML:** Using `<form>`, `<button>`, and other semantic elements for better accessibility and built-in functionality.

## 🐛 Common Issues & Solutions

### Messages Not Displaying

1.  **Check message format:** Verify the `messages` array passed to `MessageList` has the correct structure (`id`, `content`, `role`, etc.).

    console.log('Messages received in MessageList:', messages);

2.  **Ensure unique keys:** Every message must have a unique `id` for React's reconciliation process.

    // Ensure IDs are unique when creating messages
    const messageId = message.id || `msg-${Date.now()}-${Math.random()}`;

### Styling Not Applied

1.  **Verify SCSS imports:** Ensure each component's TSX file correctly imports its corresponding SCSS file.

    import "../styles/components/message-list.scss";

2.  **Check for class name typos:** Double-check that BEM class names in the TSX (`message-list__empty`) match the SCSS selectors (`.message-list__empty`).

# Remember: Great components are like LEGO blocks - each one is perfectly crafted for its purpose, but they combine to build something amazing! 🧱
