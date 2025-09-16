export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem("chatSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("chatSessionId", sessionId);
  }
  return sessionId;
};

export const clearSessionId = (): void => {
  localStorage.removeItem("chatSessionId");
};

export const getSessionId = (): string | null => {
  return localStorage.getItem("chatSessionId");
};

export const setSessionId = (id: string): void => {
  localStorage.setItem("chatSessionId", id);
};
