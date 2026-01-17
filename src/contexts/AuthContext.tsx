import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  label: string;
  accessKey: string;
  geminiApiKey?: string;
}

interface AuthContextType {
  user: User | null;
  isGeminiMode: boolean;
  geminiApiKey: string | null;
  login: (user: User) => void;
  loginWithGemini: (apiKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGeminiMode, setIsGeminiMode] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('adcreative-user');
    const savedGeminiKey = localStorage.getItem('adcreative-gemini-key');
    const savedGeminiMode = localStorage.getItem('adcreative-gemini-mode');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedGeminiKey && savedGeminiMode === 'true') {
      setGeminiApiKey(savedGeminiKey);
      setIsGeminiMode(true);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsGeminiMode(false);
    setGeminiApiKey(userData.geminiApiKey || null);
    localStorage.setItem('adcreative-user', JSON.stringify(userData));
    localStorage.removeItem('adcreative-gemini-mode');
    localStorage.removeItem('adcreative-gemini-key');
  };

  const loginWithGemini = (apiKey: string) => {
    setUser(null);
    setIsGeminiMode(true);
    setGeminiApiKey(apiKey);
    localStorage.removeItem('adcreative-user');
    localStorage.setItem('adcreative-gemini-mode', 'true');
    localStorage.setItem('adcreative-gemini-key', apiKey);
  };

  const logout = () => {
    setUser(null);
    setIsGeminiMode(false);
    setGeminiApiKey(null);
    localStorage.removeItem('adcreative-user');
    localStorage.removeItem('adcreative-gemini-mode');
    localStorage.removeItem('adcreative-gemini-key');
  };

  return (
    <AuthContext.Provider value={{ user, isGeminiMode, geminiApiKey, login, loginWithGemini, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
