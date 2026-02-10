import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/storage';

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback';
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' ');

  useEffect(() => {
    if (!userId) {
      // Si no hay usuario, limpiar tokens y desautenticar
      setAccessToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Verificar si hay token guardado para este usuario específico
    const tokenKey = getUserStorageKey('google_access_token', userId);
    const expiryKey = getUserStorageKey('google_token_expiry', userId);
    const refreshKey = getUserStorageKey('google_refresh_token', userId);
    
    const savedToken = localStorage.getItem(tokenKey);
    const savedExpiry = localStorage.getItem(expiryKey);
    
    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      if (Date.now() < expiryTime) {
        setAccessToken(savedToken);
        setIsAuthenticated(true);
      } else {
        // Token expirado, intentar refrescar
        const refreshToken = localStorage.getItem(refreshKey);
        if (refreshToken) {
          refreshAccessToken(refreshToken);
        } else {
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(expiryKey);
        }
      }
    } else {
      // No hay token para este usuario, asegurar que está desautenticado
      setAccessToken(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [userId, refreshAccessToken]);

  useEffect(() => {
    // Manejar callback de OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && userId) {
      handleCallback(code);
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId, handleCallback]);

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        const expiryTime = Date.now() + (data.expires_in * 1000);
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
        
        // Guardar con clave específica del usuario
        const tokenKey = getUserStorageKey('google_access_token', userId);
        const expiryKey = getUserStorageKey('google_token_expiry', userId);
        localStorage.setItem(tokenKey, data.access_token);
        localStorage.setItem(expiryKey, expiryTime.toString());
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  }, [userId, logout]);

  const handleCallback = useCallback(async (code: string) => {
    try {
      if (!CLIENT_ID) {
        console.error('CLIENT_ID is not defined');
        return;
      }

      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
      if (!clientSecret) {
        console.error('CLIENT_SECRET is not defined');
        return;
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error exchanging code:', data);
        if (data.error === 'invalid_client') {
          console.error('Invalid client. Check CLIENT_ID and CLIENT_SECRET in .env file');
        }
        return;
      }

      if (data.access_token && userId) {
        const expiryTime = Date.now() + (data.expires_in * 1000);
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
        
        // Guardar con clave específica del usuario
        const tokenKey = getUserStorageKey('google_access_token', userId);
        const expiryKey = getUserStorageKey('google_token_expiry', userId);
        localStorage.setItem(tokenKey, data.access_token);
        localStorage.setItem(expiryKey, expiryTime.toString());
        
        if (data.refresh_token) {
          const refreshKey = getUserStorageKey('google_refresh_token', userId);
          localStorage.setItem(refreshKey, data.refresh_token);
        }
      } else {
        console.error('No access token in response:', data);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  }, [userId]);

  const login = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const logout = useCallback(() => {
    if (userId) {
      // Limpiar tokens específicos del usuario
      const tokenKey = getUserStorageKey('google_access_token', userId);
      const expiryKey = getUserStorageKey('google_token_expiry', userId);
      const refreshKey = getUserStorageKey('google_refresh_token', userId);
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(refreshKey);
    }
    
    setAccessToken(null);
    setIsAuthenticated(false);
  }, [userId]);

  return (
    <GoogleAuthContext.Provider value={{ isAuthenticated, accessToken, login, logout, loading }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  return context;
}

