import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
    // Removed unused directors variable
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

  const projectVisitors = visitors[id!] || [];
  const [inviteVisitor, setInviteVisitor] = useState<{ allowedTabs: TabType[]; email: string } | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);

  // Manejar parámetros de invitación en la URL
  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    const inviteEmail = searchParams.get('email');

    if (inviteToken && inviteEmail && id) {
      setIsLoadingInvite(true);
      
      // Primero buscar en sessionStorage con clave invite_data_${inviteToken}
      const inviteDataKey = `invite_data_${inviteToken}`;
      const storedInviteData = sessionStorage.getItem(inviteDataKey);
      
      if (storedInviteData) {
        try {
          const inviteData = JSON.parse(storedInviteData);
          if (inviteData.allowedTabs && inviteData.projectId === id && inviteData.email.toLowerCase() === decodeURIComponent(inviteEmail).toLowerCase()) {
            setInviteVisitor({
              allowedTabs: inviteData.allowedTabs,
              email: inviteData.email,
            });
            
            // Limpiar parámetros de la URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('invite');
            newSearchParams.delete('email');
            window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
            setIsLoadingInvite(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing invite data from sessionStorage:', e);
        }
      }
      
      // Fallback: buscar el visitante en los visitantes del proyecto
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

        // Actualizar estado del visitante a 'accepted'
        updateVisitor(id, inviteToken, { status: 'accepted' });

        // Guardar información del visitante en el estado
        setInviteVisitor({
          allowedTabs: foundVisitor.allowedTabs,
          email: foundVisitor.email,
        });

        // Limpiar parámetros de la URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('invite');
        newSearchParams.delete('email');
        window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
      }
      setIsLoadingInvite(false);
    } else {
      // Verificar si hay información de invitación guardada en sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      const inviteKey = sessionKeys.find(key => key.startsWith(`invite_${id}_`) || key.startsWith('invite_data_'));
      if (inviteKey) {
        try {
          const inviteData = JSON.parse(sessionStorage.getItem(inviteKey) || '{}');
          if (inviteData.allowedTabs && inviteData.projectId === id) {
            setInviteVisitor({
              allowedTabs: inviteData.allowedTabs,
              email: inviteData.email,
            });
          }
        } catch (e) {
          console.error('Error parsing invite data:', e);
        }
      }
    }
  }, [searchParams, id, projectVisitors, updateVisitor]);

  // Buscar proyecto o crear uno temporal si hay invitación válida
  let project = projects.find((p) => p.id === id);
  
  // Si el proyecto no se encuentra pero hay una invitación válida, crear un proyecto temporal
  if (!project && inviteVisitor && inviteVisitor.allowedTabs.length > 0) {
    project = {
      id: id!,
      title: 'Shared Project',
      description: 'You have been invited to view this project',
      status: 'pre-produccion',
      category: 'originals',
      subcategory: 'feature-film',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Verificar si hay un parámetro de tab en la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['colaboradores', 'budget', 'documentos', 'tareas'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Mostrar carga mientras se procesa la invitación
  if (isLoadingInvite) {
    return (
      <div className="project-not-found">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Si no se encuentra el proyecto y no hay invitación válida, mostrar "Project not found"
  if (!project && !inviteVisitor) {
    return (
      <div className="project-not-found">
        <h2>Project not found</h2>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  // Si hay una invitación pero no hay pestañas permitidas, mostrar "Invalid Invitation"
  if (inviteVisitor && inviteVisitor.allowedTabs.length === 0) {
    return (
      <div className="project-not-found">
        <h2>Invalid Invitation</h2>
        <p>This invitation does not grant access to any project sections.</p>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  // Verificar permisos si es visitante (usuario autenticado como visitante o invitado por enlace)
  const isVisitor = user?.role === 'visitor' || inviteVisitor !== null;
  const visitor = isVisitor 
    ? (user?.role === 'visitor' 
        ? projectVisitors.find((v) => v.email === user?.email)
        : inviteVisitor 
          ? projectVisitors.find((v) => v.email === inviteVisitor.email) || { allowedTabs: inviteVisitor.allowedTabs, email: inviteVisitor.email }
          : null)
    : null;
  const allowedTabsForVisitor = inviteVisitor?.allowedTabs || visitor?.allowedTabs || [];
  
  // Si es visitante y la pestaña activa no está permitida, cambiar a la primera permitida
  useEffect(() => {
    if (isVisitor && allowedTabsForVisitor.length > 0 && !allowedTabsForVisitor.includes(activeTab)) {
      setActiveTab(allowedTabsForVisitor[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitor, allowedTabsForVisitor.length, activeTab]);

  const hasAccess = !isVisitor || (allowedTabsForVisitor.length > 0 && allowedTabsForVisitor.includes(activeTab));

  // Removed unused visitor handler functions

  // Define all available tabs
  const allTabs: { id: TabType; label: string }[] = [
    { id: 'colaboradores', label: 'Collaborators' },
    { id: 'tareas', label: 'Tasks' },
    { id: 'documentos', label: 'Documents' },
    { id: 'budget', label: 'Budget' },
  ];

  // Filtrar pestañas según permisos
  const tabs = isVisitor && allowedTabsForVisitor.length > 0
    ? allTabs.filter((tab) => allowedTabsForVisitor.includes(tab.id))
    : allTabs;

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
                onAdd={(collab) => addCollaborator(id!, { ...collab, id: Date.now().toString() })}
                onUpdate={(collabId, updates) => updateCollaborator(id!, collabId, updates)}
                onRemove={(collabId) => removeCollaborator(id!, collabId)}
                projectId={id}
                onAddVisitor={addVisitor}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab 
                budgetItems={budgets[id!] || []}
                onAddItem={(item) => addBudgetItem(id!, { ...item, id: Date.now().toString() })}
                onUpdateItem={(itemId, updates) => updateBudgetItem(id!, itemId, updates)}
                onRemoveItem={(itemId) => removeBudgetItem(id!, itemId)}
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
                onAddTask={(taskData) => addTask(id!, { ...taskData, id: Date.now().toString(), projectId: id! })}
                onUpdateTask={(taskId, updates) => updateTask(id!, taskId, updates)}
                onRemoveTask={(taskId) => removeTask(id!, taskId)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
