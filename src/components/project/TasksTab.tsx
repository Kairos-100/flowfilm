import { useState } from 'react';
import { Plus, X, Check, Calendar, User, Trash2, Edit2 } from 'lucide-react';
import { Task } from '../../types';
import { Collaborator } from '../../types';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { useProjects } from '../../contexts/ProjectsContext';
import { sendGmailMessage } from '../../services/gmail';
import './ProjectTabs.css';

interface TasksTabProps {
  tasks: Task[];
  collaborators: Collaborator[];
  projectId: string;
  onAddTask: (task: Omit<Task, 'id'>) => Promise<void> | void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void> | void;
  onRemoveTask: (taskId: string) => Promise<void> | void;
}

const statusLabels = {
  'pendiente': 'Pending',
  'en-progreso': 'In Progress',
  'completada': 'Completed',
};

const statusColors = {
  'pendiente': '#9b9a97',
  'en-progreso': '#2383e2',
  'completada': '#0f7b0f',
};

export default function TasksTab({
  tasks,
  collaborators,
  projectId,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
}: TasksTabProps) {
  const { isAuthenticated, accessToken } = useGoogleAuth();
  const { projects } = useProjects();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    assignedTo: [] as string[],
    startDate: '',
    endDate: '',
    status: 'pendiente' as Task['status'],
  });

  const sendTaskEmails = async (taskData: Omit<Task, 'id'>) => {
    if (!isAuthenticated || !accessToken || taskData.assignedTo.length === 0) return;

    const project = projects.find(p => p.id === projectId);
    const projectTitle = project?.title || 'Unknown Project';

    const statusLabels: Record<string, string> = {
      'pendiente': 'Pending',
      'en-progreso': 'In Progress',
      'completada': 'Completed',
    };

    const emailBody = `
      <h2>New Task Assigned</h2>
      <p><strong>Task:</strong> ${taskData.description}</p>
      <p><strong>Project:</strong> ${projectTitle}</p>
      <p><strong>Start Date:</strong> ${taskData.startDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}</p>
      <p><strong>End Date:</strong> ${taskData.endDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}</p>
      <p><strong>Status:</strong> ${statusLabels[taskData.status] || taskData.status}</p>
    `;

    // Enviar email a cada colaborador asignado
    for (const collaboratorId of taskData.assignedTo) {
      const collaborator = collaborators.find(c => c.id === collaboratorId);
      if (collaborator?.email) {
        try {
          await sendGmailMessage(
            accessToken,
            collaborator.email,
            `[Task] ${projectTitle}: ${taskData.description}`,
            emailBody
          );
          console.log(`Email sent to ${collaborator.email}`);
        } catch (error) {
          console.error(`Error sending email to ${collaborator.email}:`, error);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description && formData.assignedTo.length > 0 && formData.startDate && formData.endDate) {
      try {
        const taskData = {
          description: formData.description,
          assignedTo: formData.assignedTo,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          status: formData.status,
          projectId: projectId,
        };

        if (editingTask) {
          await onUpdateTask(editingTask, taskData);
          setEditingTask(null);
        } else {
          await onAddTask(taskData);
          // Enviar email a los colaboradores asignados solo al crear
          await sendTaskEmails(taskData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving task:', error);
        alert('Error al guardar la tarea. Por favor, intenta de nuevo.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      assignedTo: [],
      startDate: '',
      endDate: '',
      status: 'pendiente',
    });
    setShowAddForm(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task.id);
    setFormData({
      description: task.description,
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo], // Compatibilidad con datos antiguos
      startDate: task.startDate.toISOString().split('T')[0],
      endDate: task.endDate.toISOString().split('T')[0],
      status: task.status,
    });
    setShowAddForm(true);
  };

  const getCollaboratorName = (collaboratorId: string) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    return collaborator?.name || 'Unassigned';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const sortedTasks = [...tasks]
    .filter((task, index, self) => 
      index === self.findIndex((t) => t.id === task.id)
    )
    .sort((a, b) => {
      // Las tareas completadas al final
      if (a.status === 'completada' && b.status !== 'completada') return 1;
      if (a.status !== 'completada' && b.status === 'completada') return -1;
      
      // Ordenar por fecha de vencimiento (endDate) - las más cercanas primero
      return a.endDate.getTime() - b.endDate.getTime();
    });

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Tasks</h2>
        <button className="btn-secondary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <div className="form-field full-width">
              <label>Task (Description) *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Assigned To *</label>
              <select
                multiple
                value={formData.assignedTo}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, assignedTo: selected });
                }}
                required
                style={{ minHeight: '100px' }}
              >
                {collaborators.map((collab) => (
                  <option key={collab.id} value={collab.id}>
                    {collab.name} {collab.role ? `- ${collab.role}` : ''}
                  </option>
                ))}
              </select>
              {formData.assignedTo.length > 0 && (
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  Selected: {formData.assignedTo.length} collaborator(s)
                </small>
              )}
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
              >
                <option value="pendiente">Pending</option>
                <option value="en-progreso">In Progress</option>
                <option value="completada">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <Check size={18} />
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      )}

      {sortedTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks added yet.</p>
        </div>
      ) : (
        <div className="tasks-table">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr key={task.id} className={task.status === 'completada' ? 'task-completed' : ''}>
                  <td className="task-description">{task.description}</td>
                  <td className="task-assigned">
                    <div className="assigned-info">
                      <User size={14} />
                      <span>
                        {task.assignedTo.length === 0
                          ? 'Unassigned'
                          : task.assignedTo.length === 1
                          ? getCollaboratorName(task.assignedTo[0])
                          : `${task.assignedTo.length} collaborators`
                        }
                      </span>
                    </div>
                    {Array.isArray(task.assignedTo) && task.assignedTo.length > 1 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {task.assignedTo.map(id => getCollaboratorName(id)).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="task-date">
                    <Calendar size={14} />
                    {formatDate(task.startDate)}
                  </td>
                  <td className="task-date">
                    <Calendar size={14} />
                    {formatDate(task.endDate)}
                  </td>
                  <td>
                    <span
                      className="task-status"
                      style={{
                        backgroundColor: `${statusColors[task.status]}20`,
                        color: statusColors[task.status],
                      }}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="task-actions">
                    <button
                      className="action-button"
                      onClick={() => handleEdit(task)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-button danger"
                      onClick={async () => {
                        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                          try {
                            await onRemoveTask(task.id);
                          } catch (error) {
                            console.error('Error removing task:', error);
                            alert('Error al eliminar la tarea. Por favor, intenta de nuevo.');
                          }
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
