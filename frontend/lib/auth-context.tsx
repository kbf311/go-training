"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { User } from "./types";

interface FlashMessage {
  text: string;
  type: "success" | "error";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  flash: FlashMessage | null;
  setFlash: (flash: FlashMessage | null) => void;
  showFlash: (text: string, type?: "success" | "error") => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const router = useRouter();

  const showFlash = (text: string, type: "success" | "error" = "success") => {
    setFlash({ text, type });
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
    router.push("/monsters");
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ログアウト失敗時も状態クリア
    }
    setUser(null);
    router.push("/login");
  };

  const resetData = async () => {
    await api.resetData();
    showFlash("モンスターデータを初期化しました。", "success");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        flash,
        setFlash,
        showFlash,
        login,
        logout,
        refreshUser,
        resetData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

