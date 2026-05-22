import { createContext, useContext } from "react";

export type AuthUser = { id: string; email: string };

export const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
