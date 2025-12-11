// frontend/src/api/http.ts
import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
export const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach token
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("participant_token");

  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Handle 401 logout
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("participant_token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);
