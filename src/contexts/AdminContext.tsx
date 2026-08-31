import { createContext, useContext, useState } from "react";

interface AdminContextType {
  secret: string;
  isAuthed: boolean;
  login: (secret: string) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem("admin_secret") ?? "");

  const login = (s: string) => {
    sessionStorage.setItem("admin_secret", s);
    setSecret(s);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_secret");
    setSecret("");
  };

  return (
    <AdminContext.Provider value={{ secret, isAuthed: !!secret, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
