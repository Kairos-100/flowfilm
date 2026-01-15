import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { clearUserData } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, companyName?: string) => Promise<boolean>;
  register: (email: string, password: string, companyName: string) => Promise<boolean>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; token?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Hash password using Web Crypto API (SHA-256)
  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string, companyName?: string): Promise<boolean> => {
    // Verificar si es un usuario registrado con contraseña válida
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]') as Array<User & { passwordHash?: string }>;
    const registeredUser = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!registeredUser || !registeredUser.passwordHash) {
      return false;
    }
    const givenHash = await hashPassword(password);
    if (givenHash !== registeredUser.passwordHash) {
      return false;
    }

    const userToSave: User = {
      id: registeredUser.id,
      email: registeredUser.email,
      name: companyName?.trim() || registeredUser.name,
      role: registeredUser.role,
    };
    
    // NO establecer isNewUser flag durante login - solo durante registro
    // El flag isNewUser solo debe existir durante el registro para usuarios nuevos
    
    setUser(userToSave);
    localStorage.setItem('user', JSON.stringify(userToSave));
    return true;
  };

  const register = async (email: string, password: string, companyName: string): Promise<boolean> => {
    // Verificar si el email ya existe
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]') as Array<User & { passwordHash?: string }>;
    if (registeredUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return false; // Email ya existe
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name: companyName.trim(),
      role: 'admin', // Los nuevos usuarios son admin por defecto
    };

    // Guardar usuario registrado
    const passwordHash = await hashPassword(password);
    registeredUsers.push({ ...newUser, passwordHash });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    // Limpiar todos los datos del usuario para empezar con lienzo en blanco
    clearUserData(newUser.id);
    
    // También limpiar claves adicionales que puedan existir
    localStorage.removeItem(`customCategories_${newUser.id}`);
    localStorage.removeItem(`customSubcategories_${newUser.id}`);
    localStorage.removeItem(`customStatuses_${newUser.id}`);
    localStorage.removeItem(`customCollaboratorCategories_${newUser.id}`);
    localStorage.removeItem(`calendarEvents_${newUser.id}`);

    // Marcar que este usuario empezó con lienzo en blanco
    localStorage.setItem(`isNewUser_${newUser.id}`, 'true');

    // Iniciar sesión automáticamente
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    return true;
  };

  const requestPasswordReset = async (email: string): Promise<{ ok: boolean; token?: string }> => {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]') as Array<User & { passwordHash?: string }>;
    const registeredUser = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    // No revelar si el email existe: siempre devolver ok, pero solo generar token si existe
    if (!registeredUser) {
      return { ok: true };
    }
    // Generar token y guardar con expiración (30 min)
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const tokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '[]') as Array<{ email: string; token: string; expiresAt: number }>;
    // Eliminar tokens anteriores de ese email
    const filtered = tokens.filter(t => t.email.toLowerCase() !== email.toLowerCase());
    filtered.push({ email, token, expiresAt });
    localStorage.setItem('passwordResetTokens', JSON.stringify(filtered));
    return { ok: true, token };
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    const tokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '[]') as Array<{ email: string; token: string; expiresAt: number }>;
    const entry = tokens.find(t => t.token === token);
    if (!entry || Date.now() > entry.expiresAt) {
      return false;
    }
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]') as Array<User & { passwordHash?: string }>;
    const idx = registeredUsers.findIndex(u => u.email.toLowerCase() === entry.email.toLowerCase());
    if (idx === -1) return false;
    const passwordHash = await hashPassword(newPassword);
    registeredUsers[idx] = { ...registeredUsers[idx], passwordHash };
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    // Eliminar token usado
    const remaining = tokens.filter(t => t.token !== token);
    localStorage.setItem('passwordResetTokens', JSON.stringify(remaining));
    return true;
  };

  const logout = () => {
    // Limpiar tokens de Google del usuario actual antes de hacer logout
    if (user?.id) {
      const tokenKey = `google_access_token_${user.id}`;
      const expiryKey = `google_token_expiry_${user.id}`;
      const refreshKey = `google_refresh_token_${user.id}`;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(refreshKey);
    }
    
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
