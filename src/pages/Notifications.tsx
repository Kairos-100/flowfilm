import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertCircle, Clock, XCircle, Filter, Check, Mail } from 'lucide-react';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { getUserStorageKey } from '../utils/storage';
import { sendGmailMessage } from '../services/gmail';
import { Notification } from '../types';
import './Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const { projects, tasks, collaborators, updateTask } = useProjects();
  const { isAuthenticated, accessToken } = useGoogleAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'date'>('all');
  const [dateFilter, setDateFilter] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(getUserStorageKey('readNotifications', userId));
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Generar notificaciones basadas en las tareas
  const notifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const generatedNotifications: Notification[] = [];

    projects.forEach(project => {
      const projectTasks = tasks[project.id] || [];
      
      projectTasks.forEach(task => {
        const taskEndDate = new Date(task.endDate);
        taskEndDate.setHours(0, 0, 0, 0);
        const taskStartDate = new Date(task.startDate);
        taskStartDate.setHours(0, 0, 0, 0);

        // Solo generar UNA notificación por tarea, priorizando por urgencia
        let notificationCreated = false;

        // 1. Prioridad: Tareas vencidas
        if (!notificationCreated && taskEndDate < today && task.status !== 'completada') {
          const daysOverdue = Math.floor((today.getTime() - taskEndDate.getTime()) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `task-${task.id}`, // ID único por tarea
            type: 'task-overdue',
            title: 'Overdue Task',
            message: `The task "${task.description}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
            projectId: project.id,
            projectTitle: project.title,
            taskId: task.id,
            taskDescription: task.description,
            date: taskEndDate,
            read: readNotifications.has(`task-${task.id}`),
            priority: 'high',
          });
          notificationCreated = true;
        }
        
        // 2. Prioridad: Tareas que vencen pronto
        if (!notificationCreated && 
            taskEndDate >= today &&
            taskEndDate <= threeDaysFromNow &&
            task.status !== 'completada') {
          const daysUntilDue = Math.floor((taskEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `task-${task.id}`, // ID único por tarea
            type: 'task-due-soon',
            title: 'Task Due Soon',
            message: `The task "${task.description}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
            projectId: project.id,
            projectTitle: project.title,
            taskId: task.id,
            taskDescription: task.description,
            date: taskEndDate,
            read: readNotifications.has(`task-${task.id}`),
            priority: daysUntilDue === 0 ? 'high' : 'medium',
          });
          notificationCreated = true;
        }
        
        // 3. Prioridad: Tareas que empiezan pronto (solo si no hay notificación más urgente)
        if (!notificationCreated &&
            taskStartDate >= today &&
            taskStartDate <= twoDaysFromNow &&
            task.status === 'pendiente') {
          const daysUntilStart = Math.floor((taskStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `task-${task.id}`, // ID único por tarea
            type: 'task-starting-soon',
            title: 'Task Starting Soon',
            message: `The task "${task.description}" starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`,
            projectId: project.id,
            projectTitle: project.title,
            taskId: task.id,
            taskDescription: task.description,
            date: taskStartDate,
            read: readNotifications.has(`task-${task.id}`),
            priority: 'low',
          });
        }
      });
    });

    // Ordenar por fecha (más recientes primero)
    return generatedNotifications.sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });
  }, [projects, tasks, readNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      if (filter === 'unread') return !notif.read;
      if (filter === 'date') {
        if (!dateFilter.start || !dateFilter.end) return true;
        const notifDate = new Date(notif.date);
        notifDate.setHours(0, 0, 0, 0);
        return notifDate >= dateFilter.start && notifDate <= dateFilter.end;
      }
      return true;
    });
  }, [notifications, filter, dateFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notification.id);
    setReadNotifications(newReadNotifications);
    if (userId) {
      localStorage.setItem(getUserStorageKey('readNotifications', userId), JSON.stringify(Array.from(newReadNotifications)));
    }

    // Navigate to project with tasks tab active
    navigate(`/project/${notification.projectId}?tab=tareas`);
  };

  const handleMarkAsCompleted = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    try {
      updateTask(notification.projectId, notification.taskId, { status: 'completada' });
      // Marcar notificación como leída
      const newReadNotifications = new Set(readNotifications);
      newReadNotifications.add(notification.id);
      setReadNotifications(newReadNotifications);
      if (userId) {
        localStorage.setItem(getUserStorageKey('readNotifications', userId), JSON.stringify(Array.from(newReadNotifications)));
      }
    } catch (error) {
      console.error('Error marking task as completed:', error);
      alert('Error al marcar la tarea como completada');
    }
  };

  const handleSendReminder = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    
    if (!isAuthenticated || !accessToken) {
      alert('Por favor, conecta tu cuenta de Gmail primero.');
      return;
    }

    const task = tasks[notification.projectId]?.find(t => t.id === notification.taskId);
    if (!task) {
      alert('No se pudo encontrar la tarea.');
      return;
    }

    if (!task.assignedTo || task.assignedTo.length === 0) {
      alert('Esta tarea no tiene colaboradores asignados.');
      return;
    }

    const project = projects.find(p => p.id === notification.projectId);
    const projectTitle = project?.title || 'Unknown Project';
    const projectCollaborators = collaborators[notification.projectId] || [];

    const statusLabels: Record<string, string> = {
      'pendiente': 'Pending',
      'en-progreso': 'In Progress',
      'completada': 'Completed',
    };

    const emailBody = `
      <h2>Task Reminder</h2>
      <p><strong>Task:</strong> ${task.description}</p>
      <p><strong>Project:</strong> ${projectTitle}</p>
      <p><strong>Start Date:</strong> ${task.startDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}</p>
      <p><strong>End Date:</strong> ${task.endDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}</p>
      <p><strong>Status:</strong> ${statusLabels[task.status] || task.status}</p>
      <p><em>This is a reminder about this task. Please check your progress and update the status if needed.</em></p>
    `;

    let successCount = 0;
    let errorCount = 0;

    for (const collaboratorId of task.assignedTo) {
      const collaborator = projectCollaborators.find(c => c.id === collaboratorId);
      if (collaborator?.email) {
        try {
          await sendGmailMessage(
            accessToken,
            collaborator.email,
            `[Reminder] ${projectTitle}: ${task.description}`,
            emailBody
          );
          successCount++;
        } catch (error) {
          console.error(`Error sending reminder to ${collaborator.email}:`, error);
          errorCount++;
        }
      }
    }

    if (successCount > 0) {
      alert(`Recordatorio enviado a ${successCount} colaborador${successCount > 1 ? 'es' : ''}.`);
    }
    if (errorCount > 0) {
      alert(`Error al enviar ${errorCount} recordatorio${errorCount > 1 ? 's' : ''}.`);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadNotifications = new Set([...readNotifications, ...allIds]);
    setReadNotifications(newReadNotifications);
    if (userId) {
      localStorage.setItem(getUserStorageKey('readNotifications', userId), JSON.stringify(Array.from(newReadNotifications)));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task-overdue':
        return <XCircle size={20} className="icon-overdue" />;
      case 'task-due-soon':
        return <AlertCircle size={20} className="icon-due-soon" />;
      case 'task-starting-soon':
        return <Clock size={20} className="icon-starting" />;
      case 'task-completed':
        return <CheckCircle2 size={20} className="icon-completed" />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationClass = (notification: Notification) => {
    const classes = ['notification-item'];
    if (!notification.read) classes.push('unread');
    if (notification.priority === 'high') classes.push('high-priority');
    return classes.join(' ');
  };

  const getTaskAssignedNames = (notification: Notification): string => {
    const task = tasks[notification.projectId]?.find(t => t.id === notification.taskId);
    if (!task || !task.assignedTo || task.assignedTo.length === 0) {
      return 'Unassigned';
    }

    const projectCollaborators = collaborators[notification.projectId] || [];
    const names = task.assignedTo
      .map(id => {
        const collaborator = projectCollaborators.find(c => c.id === id);
        return collaborator?.name || 'Unknown';
      })
      .filter(name => name !== 'Unknown');

    if (names.length === 0) return 'Unassigned';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-header-left">
          <Bell size={24} />
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="notifications-header-right">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className={`filter-btn ${filter === 'date' ? 'active' : ''}`}
              onClick={() => setFilter('date')}
            >
              <Filter size={16} />
              Date
            </button>
          </div>
          {filter === 'date' && (
            <div className="date-filter-inputs">
              <input
                type="date"
                value={dateFilter.start ? dateFilter.start.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value ? new Date(e.target.value) : null })}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateFilter.end ? dateFilter.end.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value ? new Date(e.target.value) : null })}
                className="date-input"
              />
            </div>
          )}
          {unreadCount > 0 && (
            <button className="btn-mark-all-read" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="notifications-content">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications</p>
            {filter !== 'all' && (
              <button className="btn-clear-filter" onClick={() => setFilter('all')}>
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={getNotificationClass(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-date">
                      {notification.date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: notification.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                      })}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-project">{notification.projectTitle}</span>
                    <span className="notification-assigned">• {getTaskAssignedNames(notification)}</span>
                  </div>
                </div>
                <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="action-btn complete-btn"
                    onClick={(e) => handleMarkAsCompleted(e, notification)}
                    title="Mark as completed"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="action-btn reminder-btn"
                    onClick={(e) => handleSendReminder(e, notification)}
                    title="Send reminder email"
                  >
                    <Mail size={16} />
                  </button>
                </div>
                {!notification.read && <div className="unread-indicator" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

