import axios, { AxiosResponse } from "axios";
import { ApiResponse, ChatResponse, ChatSession } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Chat API
export const chatApi = {
  sendMessage: async (sessionId: string, message: string): Promise<ApiResponse<ChatResponse>> => {
    const response: AxiosResponse<ApiResponse<ChatResponse>> = await api.post("/chat", {
      sessionId,
      message,
    });
    return response.data;
  },

  getHistory: async (sessionId: string): Promise<ApiResponse<ChatSession>> => {
    const response: AxiosResponse<ApiResponse<ChatSession>> = await api.get(`/session/${sessionId}/history`);
    return response.data;
  },
};

// Session API
export const sessionApi = {
  create: async (): Promise<ApiResponse<{ sessionId: string; createdAt: string; messageCount: number }>> => {
    const response = await api.post("/session/create", {});
    return response.data;
  },

  clear: async (sessionId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/session/${sessionId}/clear`);
    return response.data;
  },

  getHistory: async (sessionId: string): Promise<ApiResponse<ChatSession>> => {
    const response = await api.get(`/session/${sessionId}/history`);
    return response.data;
  },
};

// response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 503) {
      console.warn("Service temporarily unavailable");
    }
    return Promise.reject(error);
  }
);
