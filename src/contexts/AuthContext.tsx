import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && profile) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: profile.name,
          role: profile.role as 'admin' | 'member' | 'visitor',
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, companyName?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (!data.user) {
        return false;
      }

      if (companyName?.trim()) {
        await supabase
          .from('user_profiles')
          .update({ name: companyName.trim() })
          .eq('id', data.user.id);
      }

      await loadUserProfile(data.user.id);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, companyName: string): Promise<boolean> => {
    try {
      console.log('Starting registration for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: companyName.trim(),
            role: 'admin',
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return false;
        }
        return false;
      }

      if (!data.user) {
        console.error('No user returned from registration');
        return false;
      }

      console.log('User created:', data.user.id);
      console.log('Session exists:', !!data.session);

      // Crear el perfil del usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          name: companyName.trim(),
          role: 'admin',
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('Profile created successfully');
      }

      clearUserData(data.user.id);
      localStorage.removeItem(`customCategories_${data.user.id}`);
      localStorage.removeItem(`customSubcategories_${data.user.id}`);
      localStorage.removeItem(`customStatuses_${data.user.id}`);
      localStorage.removeItem(`customCollaboratorCategories_${data.user.id}`);
      localStorage.removeItem(`calendarEvents_${data.user.id}`);
      localStorage.setItem(`isNewUser_${data.user.id}`, 'true');

      // Si hay sesión inmediata, cargar perfil
      if (data.session) {
        console.log('Session available, loading profile...');
        await loadUserProfile(data.user.id);
        return true;
      }

      // Si no hay sesión, esperar un momento y verificar de nuevo
      console.log('No session immediately, waiting and checking...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar sesión nuevamente
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
        console.log('Session found after wait, loading profile...');
        await loadUserProfile(newSession.user.id);
        return true;
      }

      // Si aún no hay sesión, intentar iniciar sesión automáticamente
      console.log('No session found, attempting auto-login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Auto-login error:', loginError);
        return false;
      }

      if (loginData.user) {
        console.log('Auto-login successful, loading profile...');
        await loadUserProfile(loginData.user.id);
        return true;
      }

      console.error('Registration completed but no session available');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ ok: boolean; token?: string }> => {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { ok: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { ok: true };
    }
  };

  const resetPassword = async (_token: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password reset error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        localStorage.removeItem(`google_access_token_${user.id}`);
        localStorage.removeItem(`google_token_expiry_${user.id}`);
        localStorage.removeItem(`google_refresh_token_${user.id}`);
      }

      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

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