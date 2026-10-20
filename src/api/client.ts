import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

const TOKEN_KEY = "money-track-token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Evento global de sessao expirada (consumido pelo AuthContext)
export const authEvents = new EventTarget();

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      authEvents.dispatchEvent(new Event("unauthorized"));
    }
    return Promise.reject(error);
  },
);

/** Extrai mensagem de erro legivel (em portugues) de uma resposta da API. */
export function errorMessage(error: unknown, fallback = "Ocorreu um erro"): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.fieldErrors?.length) {
      return body.fieldErrors.map((f) => f.message).join(". ");
    }
    if (body?.message) {
      return body.message;
    }
  }
  return fallback;
}
