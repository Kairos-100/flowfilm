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
    // Removed unused visitor functions
    addTask,
    updateTask,
    removeTask,
  } = useProjects();

  const project = projects.find((p) => p.id === id);
  const projectVisitors = visitors[id!] || [];

  // Verificar si hay un parámetro de tab en la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['colaboradores', 'budget', 'documentos', 'tareas'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  if (!project) {
    return (
      <div className="project-not-found">
        <h2>Project not found</h2>
        <Link to="/">Back to Projects</Link>
      </div>
    );
  }

  // Verificar permisos si es visitante
  const isVisitor = user?.role === 'visitor';
  const visitor = isVisitor ? projectVisitors.find((v) => v.email === user?.email) : null;
  const allowedTabsForVisitor = visitor?.allowedTabs || [];
  
  // Si es visitante y la pestaña activa no está permitida, cambiar a la primera permitida
  useEffect(() => {
    if (isVisitor && visitor && !allowedTabsForVisitor.includes(activeTab) && allowedTabsForVisitor.length > 0) {
      setActiveTab(allowedTabsForVisitor[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitor, visitor?.id, activeTab]);

  const hasAccess = !isVisitor || (visitor && visitor.allowedTabs.includes(activeTab));

  // Removed unused visitor handler functions

  // Define all available tabs
  const allTabs: { id: TabType; label: string }[] = [
    { id: 'colaboradores', label: 'Collaborators' },
    { id: 'tareas', label: 'Tasks' },
    { id: 'documentos', label: 'Documents' },
    { id: 'budget', label: 'Budget' },
  ];

  // Filtrar pestañas según permisos
  const tabs = isVisitor && visitor
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
