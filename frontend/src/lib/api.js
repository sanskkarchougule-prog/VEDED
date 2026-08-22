import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const mediaUrl = (path) => `${BACKEND_URL}${path}`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("veded_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function formatError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  if (detail.msg) return detail.msg;
  return String(detail);
}

export default api;
