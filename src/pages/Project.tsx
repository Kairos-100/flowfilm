import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CollaboratorsTab from '../components/project/CollaboratorsTab';
import BudgetTab from '../components/project/BudgetTab';
import DocumentsTab from '../components/project/DocumentsTab';
import TasksTab from '../components/project/TasksTab';
import { TabType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';
import './Project.css';

const ALL_TABS: { id: TabType; label: string }[] = [
  { id: 'colaboradores', label: 'Collaborators' },
  { id: 'tareas', label: 'Tasks' },
  { id: 'documentos', label: 'Documents' },
  { id: 'budget', label: 'Budget' },
];

const VALID_TABS: TabType[] = ['colaboradores', 'budget', 'documentos', 'tareas'];

const cleanUrlParams = (searchParams: URLSearchParams) => {
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.delete('invite');
  newSearchParams.delete('email');
  const queryString = newSearchParams.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${queryString ? '?' + queryString : ''}`);
};

const createTemporaryProject = (id: string) => ({
  id,
  title: 'Shared Project',
  description: 'You have been invited to view this project',
  status: 'pre-produccion' as const,
  category: 'originals' as const,
  subcategory: 'feature-film' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('colaboradores');
  const { user } = useAuth();
  const {
    projects,
    collaborators,
    budgets,
    scripts,
    documents,
    visitors,
    tasks,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    addVisitor,
    updateVisitor,
    addTask,
    updateTask,
    removeTask,
  } = useProjects();

  const projectVisitors = useMemo(() => visitors[id!] || [], [visitors, id]);
  const [inviteVisitor, setInviteVisitor] = useState<{ allowedTabs: TabType[]; email: string } | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);

  const processInviteFromStorage = useCallback((inviteToken: string, inviteEmail: string, projectId: string) => {
    const inviteDataKey = `invite_data_${inviteToken}`;
    const storedInviteData = sessionStorage.getItem(inviteDataKey);
    
    if (storedInviteData) {
      try {
        const inviteData = JSON.parse(storedInviteData);
        const emailMatch = inviteData.email?.toLowerCase() === decodeURIComponent(inviteEmail).toLowerCase();
        
        if (inviteData.allowedTabs && inviteData.projectId === projectId && emailMatch) {
          setInviteVisitor({
            allowedTabs: inviteData.allowedTabs,
            email: inviteData.email,
          });
          cleanUrlParams(searchParams);
          return true;
        }
      } catch (e) {
        console.error('Error parsing invite data from sessionStorage:', e);
      }
    }
    return false;
  }, [searchParams]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'member')) {
      if (inviteVisitor !== null) {
        setInviteVisitor(null);
      }
      return;
    }

    const inviteToken = searchParams.get('invite');
    const inviteEmail = searchParams.get('email');

    if (!inviteToken || !inviteEmail || !id) {
      const sessionKeys = Object.keys(sessionStorage);
      const inviteKey = sessionKeys.find(key => 
        key.startsWith(`invite_${id}_`) || key.startsWith('invite_data_')
      );
      
      if (inviteKey && user?.role === 'visitor') {
        try {
          const inviteData = JSON.parse(sessionStorage.getItem(inviteKey) || '{}');
          const emailMatch = inviteData.email?.toLowerCase() === user?.email?.toLowerCase();
          if (inviteData.allowedTabs && inviteData.projectId === id && emailMatch) {
            setInviteVisitor({
              allowedTabs: inviteData.allowedTabs,
              email: inviteData.email,
            });
          }
        } catch (e) {
          console.error('Error parsing invite data:', e);
        }
      }
      return;
    }

    setIsLoadingInvite(true);
    
    if (processInviteFromStorage(inviteToken, inviteEmail, id)) {
      setIsLoadingInvite(false);
      return;
    }
    
    const foundVisitor = projectVisitors.find(
      (v) => v.id === inviteToken && v.email.toLowerCase() === decodeURIComponent(inviteEmail).toLowerCase()
    );

    if (foundVisitor) {
      // Guardar información en sessionStorage para acceso temporal
      sessionStorage.setItem(`invite_${id}_${inviteToken}`, JSON.stringify({
        email: foundVisitor.email,
        allowedTabs: foundVisitor.allowedTabs,
        projectId: id,
      }));

      updateVisitor(id, inviteToken, { status: 'accepted' });

      setInviteVisitor({
        allowedTabs: foundVisitor.allowedTabs,
        email: foundVisitor.email,
      });

      cleanUrlParams(searchParams);
    }
    
    setIsLoadingInvite(false);
  }, [searchParams, id, projectVisitors, updateVisitor, processInviteFromStorage, user, inviteVisitor]);

  const project = useMemo(() => {
    const foundProject = projects.find((p) => p.id === id);
    
    if (!foundProject && inviteVisitor && inviteVisitor.allowedTabs.length > 0) {
      return createTemporaryProject(id!);
    }
    
    return foundProject;
  }, [projects, id, inviteVisitor]);

  // Verificar si hay un parámetro de tab en la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const visitorPermissions = useMemo(() => {
    if (user && (user.role === 'admin' || user.role === 'member')) {
      return { isVisitor: false, allowedTabs: [] as TabType[], visitor: null };
    }

    const isVisitor = user?.role === 'visitor' || inviteVisitor !== null;
    
    if (!isVisitor) {
      return { isVisitor: false, allowedTabs: [] as TabType[], visitor: null };
    }

    const visitor = user?.role === 'visitor'
      ? projectVisitors.find((v) => v.email === user?.email)
      : inviteVisitor
        ? projectVisitors.find((v) => v.email === inviteVisitor.email) || {
            allowedTabs: inviteVisitor.allowedTabs,
            email: inviteVisitor.email
          }
        : null;

    const allowedTabs: TabType[] = inviteVisitor?.allowedTabs || visitor?.allowedTabs || [];
    
    return { isVisitor, allowedTabs, visitor };
  }, [user, inviteVisitor, projectVisitors]);

  useEffect(() => {
    if (visitorPermissions.isVisitor && 
        visitorPermissions.allowedTabs.length > 0 && 
        !visitorPermissions.allowedTabs.includes(activeTab)) {
      setActiveTab(visitorPermissions.allowedTabs[0]);
    }
  }, [visitorPermissions.isVisitor, visitorPermissions.allowedTabs, activeTab]);

  const hasAccess = !visitorPermissions.isVisitor || 
    (visitorPermissions.allowedTabs.length > 0 && visitorPermissions.allowedTabs.includes(activeTab));

  const tabs = useMemo(() => {
    return visitorPermissions.isVisitor && visitorPermissions.allowedTabs.length > 0
      ? ALL_TABS.filter((tab) => visitorPermissions.allowedTabs.includes(tab.id))
      : ALL_TABS;
  }, [visitorPermissions]);

  const handleAddCollaborator = useCallback(async (collab: Omit<import('../types').Collaborator, 'id'>) => {
    if (id) {
      try {
        await addCollaborator(id, { ...collab, id: Date.now().toString() });
      } catch (error) {
        console.error('Error adding collaborator:', error);
        alert('Error al agregar el colaborador. Por favor, intenta de nuevo.');
      }
    }
  }, [id, addCollaborator]);

  const handleAddBudgetItem = useCallback(async (item: Omit<import('../types').BudgetItem, 'id'>) => {
    if (id) {
      try {
        await addBudgetItem(id, { ...item, id: Date.now().toString() });
      } catch (error) {
        console.error('Error adding budget item:', error);
        alert('Error al agregar el item de presupuesto. Por favor, intenta de nuevo.');
      }
    }
  }, [id, addBudgetItem]);

  const handleAddTask = useCallback(async (taskData: Omit<import('../types').Task, 'id' | 'projectId'>) => {
    if (id) {
      try {
        await addTask(id, { ...taskData, id: Date.now().toString(), projectId: id });
      } catch (error) {
        console.error('Error adding task:', error);
        alert('Error al agregar la tarea. Por favor, intenta de nuevo.');
      }
    }
  }, [id, addTask]);

  if (isLoadingInvite) {
    return (
      <div className="project-not-found">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!project && !inviteVisitor) {
    return (
      <div className="project-not-found">
        <h2>Project not found</h2>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  if (inviteVisitor && inviteVisitor.allowedTabs.length === 0) {
    return (
      <div className="project-not-found">
        <h2>Invalid Invitation</h2>
        <p>This invitation does not grant access to any project sections.</p>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-not-found">
        <h2>Project not found</h2>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="project-page">
      <Link to="/" className="back-button">
        <ArrowLeft size={18} />
        <span>Back to Projects</span>
      </Link>

      <div className="project-header">
        <h1>{project.title}</h1>
        {project.description && <p className="project-subtitle">{project.description}</p>}
      </div>

      <div className="project-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="project-content">
        {!hasAccess ? (
          <div className="access-denied">
            <h3>Access Denied</h3>
            <p>You don't have permission to view this project section.</p>
          </div>
        ) : (
          <>
            {activeTab === 'colaboradores' && (
              <CollaboratorsTab
                collaborators={collaborators[id!] || []}
                onAdd={handleAddCollaborator}
                onUpdate={async (collabId, updates) => {
                  try {
                    await updateCollaborator(id!, collabId, updates);
                  } catch (error) {
                    console.error('Error updating collaborator:', error);
                    alert('Error al actualizar el colaborador. Por favor, intenta de nuevo.');
                  }
                }}
                onRemove={async (collabId) => {
                  try {
                    await removeCollaborator(id!, collabId);
                  } catch (error) {
                    console.error('Error removing collaborator:', error);
                    alert('Error al eliminar el colaborador. Por favor, intenta de nuevo.');
                  }
                }}
                projectId={id}
                onAddVisitor={async (projectId, visitor) => {
                  try {
                    await addVisitor(projectId, visitor);
                  } catch (error) {
                    console.error('Error adding visitor:', error);
                    alert('Error al agregar el visitante. Por favor, intenta de nuevo.');
                  }
                }}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab 
                budgetItems={budgets[id!] || []}
                onAddItem={handleAddBudgetItem}
                onUpdateItem={async (itemId, updates) => {
                  try {
                    await updateBudgetItem(id!, itemId, updates);
                  } catch (error) {
                    console.error('Error updating budget item:', error);
                    alert('Error al actualizar el item de presupuesto. Por favor, intenta de nuevo.');
                  }
                }}
                onRemoveItem={async (itemId) => {
                  try {
                    await removeBudgetItem(id!, itemId);
                  } catch (error) {
                    console.error('Error removing budget item:', error);
                    alert('Error al eliminar el item de presupuesto. Por favor, intenta de nuevo.');
                  }
                }}
              />
            )}
            {activeTab === 'documentos' && (
              <DocumentsTab 
                documents={documents[id!] || []}
                scripts={scripts[id!] || []}
                projectId={id!}
              />
            )}
            {activeTab === 'tareas' && (
              <TasksTab
                tasks={tasks[id!] || []}
                collaborators={collaborators[id!] || []}
                projectId={id!}
                onAddTask={handleAddTask}
                onUpdateTask={async (taskId, updates) => {
                  try {
                    await updateTask(id!, taskId, updates);
                  } catch (error) {
                    console.error('Error updating task:', error);
                    alert('Error al actualizar la tarea. Por favor, intenta de nuevo.');
                  }
                }}
                onRemoveTask={async (taskId) => {
                  try {
                    await removeTask(id!, taskId);
                  } catch (error) {
                    console.error('Error removing task:', error);
                    alert('Error al eliminar la tarea. Por favor, intenta de nuevo.');
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
