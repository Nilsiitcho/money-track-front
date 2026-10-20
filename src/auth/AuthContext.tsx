import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authEvents, tokenStore } from "../api/client";
import { login as loginRequest } from "../api/endpoints";

interface AuthState {
  authenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

const USER_KEY = "money-track-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUsername(null);
    };
    authEvents.addEventListener("unauthorized", handler);
    return () => authEvents.removeEventListener("unauthorized", handler);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      authenticated: !!token,
      username,
      login: async (user, pass) => {
        const res = await loginRequest(user, pass);
        tokenStore.set(res.token);
        localStorage.setItem(USER_KEY, res.username);
        setToken(res.token);
        setUsername(res.username);
      },
      logout: () => {
        tokenStore.clear();
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUsername(null);
      },
    }),
    [token, username],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
