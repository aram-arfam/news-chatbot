import React from "react";
import { TypingIndicatorProps } from "../types";
import "../styles/components/typing-indicator.scss";

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`typing-indicator ${className}`}>
      <div className="typing-indicator__avatar">🤖</div>
      <div className="typing-indicator__content">
        <div className="typing-indicator__bubble">
          <div className="typing-indicator__dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="typing-indicator__text">AI is thinking...</div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
