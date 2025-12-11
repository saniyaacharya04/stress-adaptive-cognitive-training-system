// src/api/http.ts
import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false,
});

// Inject admin token for protected routes
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
