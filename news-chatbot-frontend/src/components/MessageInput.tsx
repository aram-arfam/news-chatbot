import React, { useState, KeyboardEvent, ChangeEvent, useRef, useEffect } from "react";
import { MessageInputProps } from "../types";
import "../styles/components/message-input.scss";

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, placeholder = "Type your message..." }) => {
  const [input, setInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="message-input__container">
        <textarea ref={textareaRef} className="message-input__field" value={input} onChange={handleInputChange} onKeyDown={handleKeyPress} placeholder={placeholder} disabled={isLoading} rows={1} />

        <button type="submit" className={`message-input__button ${isLoading ? "loading" : ""}`} disabled={isLoading || !input.trim()}>
          {isLoading ? "⏳" : "⎆"}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
