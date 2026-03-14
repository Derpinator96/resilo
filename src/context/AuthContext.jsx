import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Load from localStorage if present
    const saved = localStorage.getItem('resilo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role, extraData = {}) => {
    const userData = { role, ...extraData };
    setUser(userData);
    localStorage.setItem('resilo_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resilo_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
