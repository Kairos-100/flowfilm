import { Link, useLocation } from 'react-router-dom';
import { Film, Calendar, LogOut, User, Moon, Sun, Award, Mail, Bell, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects } from '../contexts/ProjectsContext';
import { getUserStorageKey } from '../utils/storage';
import { useMemo } from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projects, tasks } = useProjects();

  // Calcular notificaciones no leídas
  const userId = user?.id || null;
  const unreadCount = useMemo(() => {
    const readNotifications = new Set(
      JSON.parse(localStorage.getItem(getUserStorageKey('readNotifications', userId)) || '[]')
    );
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    let count = 0;
    projects.forEach(project => {
      const projectTasks = tasks[project.id] || [];
      projectTasks.forEach(task => {
        const taskEndDate = new Date(task.endDate);
        taskEndDate.setHours(0, 0, 0, 0);
        const taskStartDate = new Date(task.startDate);
        taskStartDate.setHours(0, 0, 0, 0);

        // Solo contar UNA notificación por tarea, usando el mismo ID que en Notifications.tsx
        let notificationExists = false;

        // 1. Prioridad: Tareas vencidas
        if (!notificationExists && taskEndDate < today && task.status !== 'completada') {
          if (!readNotifications.has(`task-${task.id}`)) count++;
          notificationExists = true;
        }
        
        // 2. Prioridad: Tareas que vencen pronto
        if (!notificationExists &&
            taskEndDate >= today &&
            taskEndDate <= threeDaysFromNow &&
            task.status !== 'completada') {
          if (!readNotifications.has(`task-${task.id}`)) count++;
          notificationExists = true;
        }
        
        // 3. Prioridad: Tareas que empiezan pronto (solo si no hay notificación más urgente)
        if (!notificationExists &&
            taskStartDate >= today &&
            taskStartDate <= twoDaysFromNow &&
            task.status === 'pendiente') {
          if (!readNotifications.has(`task-${task.id}`)) count++;
        }
      });
    });
    return count;
  }, [projects, tasks, userId]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Film size={24} />
          <h1>{user?.name || 'Flow Film'}</h1>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Film size={20} />
            <span>Projects</span>
          </Link>
          <Link
            to="/notifications"
            className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
          >
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
          <Link
            to="/contacts"
            className={`nav-item ${location.pathname === '/contacts' ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Contacts</span>
          </Link>
          <Link
            to="/calendar"
            className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            <Calendar size={20} />
            <span>Calendar</span>
          </Link>
          <Link
            to="/gmail"
            className={`nav-item ${location.pathname === '/gmail' ? 'active' : ''}`}
          >
            <Mail size={20} />
            <span>Gmail</span>
          </Link>
          <Link
            to="/festivals"
            className={`nav-item ${location.pathname === '/festivals' ? 'active' : ''}`}
          >
            <Award size={20} />
            <span>Festivals</span>
          </Link>
          <button 
            className="nav-item theme-toggle" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name.charAt(0).toUpperCase() || <User size={18} />}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Administrator' : user?.role === 'member' ? 'Member' : 'Visitor'}</div>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
