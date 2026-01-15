import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectsProvider } from './contexts/ProjectsContext';
import { FestivalsProvider } from './contexts/FestivalsContext';
import { ContactsProvider } from './contexts/ContactsContext';
import { GoogleAuthProvider, useGoogleAuth } from './contexts/GoogleAuthContext';
import { CalendarEventsProvider } from './contexts/CalendarEventsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Project from './pages/Project';
import Calendar from './pages/Calendar';
import Gmail from './pages/Gmail';
import Notifications from './pages/Notifications';
import Festivals from './pages/Festivals';
import Login from './pages/Login';
import Register from './pages/Register';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GoogleCallback() {
  const { isAuthenticated, loading } = useGoogleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    // Verificar si hay un error en la URL
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
      setMessage('Authentication failed');
      return;
    }

    // Si ya está autenticado, redirigir
    if (isAuthenticated && !loading) {
      setMessage('Success! Redirecting...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } else if (!loading) {
      // Si no está autenticado y no está cargando, puede que haya un problema
      setTimeout(() => {
        if (!isAuthenticated) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      }, 3000);
    }
  }, [isAuthenticated, loading, navigate, searchParams]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'var(--error, #dc2626)', marginBottom: '16px' }}>Authentication Error</h2>
        <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent, #d4af37)',
            color: 'var(--bg-primary, #fff)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2>{message}</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
        Please wait while we connect your Google account.
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<RequestPasswordReset />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <Project />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gmail"
        element={
          <ProtectedRoute>
            <Layout>
              <Gmail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/festivals"
        element={
          <ProtectedRoute>
            <Layout>
              <Festivals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <GoogleAuthProvider>
            <CalendarEventsProvider>
              <ContactsProvider>
                <ProjectsProvider>
                  <FestivalsProvider>
                    <AppRoutes />
                  </FestivalsProvider>
                </ProjectsProvider>
              </ContactsProvider>
            </CalendarEventsProvider>
          </GoogleAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
