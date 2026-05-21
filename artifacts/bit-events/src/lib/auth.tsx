import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("auth_token"));
  }, []);

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const handleLogin = (newToken: string, _newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  useEffect(() => {
    if (error) {
      handleLogout();
    }
  }, [error]);

  return (
    <AuthContext.Provider value={{
      user: token ? (user ?? null) : null,
      token,
      login: handleLogin,
      logout: handleLogout,
      isLoading: !!token && isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
