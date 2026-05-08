/**
 * Axios API Client
 *
 * Centralized HTTP client that:
 * - Automatically attaches the JWT token to every request
 * - Redirects to /signin on 401/403 responses
 */

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/* ── Request Interceptor: attach JWT ── */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/* ── Response Interceptor: handle auth errors ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Only redirect if we're in the browser and not already on an auth page
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const isAuthPage =
          path === "/signin" ||
          path === "/signup" ||
          path === "/forgot-password";

        if (!isAuthPage) {
          localStorage.removeItem("token");
          window.location.href = "/signin";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
