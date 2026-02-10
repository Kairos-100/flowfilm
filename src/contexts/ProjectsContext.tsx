import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Collaborator, BudgetItem, Script, Document, Director, Visitor, Task } from '../types';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/storage';

interface ProjectsContextType {
  projects: Project[];
  collaborators: Record<string, Collaborator[]>;
  budgets: Record<string, BudgetItem[]>;
  scripts: Record<string, Script[]>;
  documents: Record<string, Document[]>;
  directors: Record<string, Director>;
  visitors: Record<string, Visitor[]>;
  tasks: Record<string, Task[]>;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  addCollaborator: (projectId: string, collaborator: Collaborator) => void;
  updateCollaborator: (projectId: string, collaboratorId: string, updates: Partial<Collaborator>) => void;
  removeCollaborator: (projectId: string, collaboratorId: string) => void;
  addBudgetItem: (projectId: string, item: BudgetItem) => void;
  updateBudgetItem: (projectId: string, itemId: string, updates: Partial<BudgetItem>) => void;
  removeBudgetItem: (projectId: string, itemId: string) => void;
  addScript: (projectId: string, script: Script) => void;
  addDocument: (projectId: string, document: Document) => void;
  setDirector: (projectId: string, director: Director) => void;
  addVisitor: (projectId: string, visitor: Visitor) => void;
  updateVisitor: (projectId: string, visitorId: string, updates: Partial<Visitor>) => void;
  removeVisitor: (projectId: string, visitorId: string) => void;
  removeProject: (projectId: string) => void;
  addTask: (projectId: string, task: Task) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  removeTask: (projectId: string, taskId: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [projects, setProjects] = useState<Project[]>([]);

  const [collaborators, setCollaborators] = useState<Record<string, Collaborator[]>>({});

  const [budgets, setBudgets] = useState<Record<string, BudgetItem[]>>({});

  const [scripts, setScripts] = useState<Record<string, Script[]>>({});

  const [documents, setDocuments] = useState<Record<string, Document[]>>({});

  const [directors, setDirectors] = useState<Record<string, Director>>({});

  const [visitors, setVisitors] = useState<Record<string, Visitor[]>>({});

  const [tasks, setTasks] = useState<Record<string, Task[]>>({});

  // Recargar datos cuando userId esté disponible (después del login)
  useEffect(() => {
    if (!userId) return;

    // Recargar projects
    const savedProjects = localStorage.getItem(getUserStorageKey('projects', userId));
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed.map((p: Partial<Project> & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...p,
          category: p.category || 'originals',
          subcategory: p.subcategory || 'feature-film',
          region: p.region || undefined,
          country: p.country || undefined,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
      } catch (e) {
        console.error('Error loading projects:', e);
      }
    }

    // Recargar collaborators
    const savedCollaborators = localStorage.getItem(getUserStorageKey('collaborators', userId));
    if (savedCollaborators) {
      try {
        const parsed = JSON.parse(savedCollaborators);
        setCollaborators(Object.keys(parsed).reduce((acc, key) => {
          acc[key] = parsed[key].map((c: Partial<Collaborator>) => ({
            ...c,
            category: c.category || 'studios',
          }));
          return acc;
        }, {} as Record<string, Collaborator[]>));
      } catch (e) {
        console.error('Error loading collaborators:', e);
        setCollaborators({});
      }
    } else {
      setCollaborators({});
    }

    // Recargar budgets
    const savedBudgets = localStorage.getItem(getUserStorageKey('budgets', userId));
    if (savedBudgets) {
      try {
        setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error('Error loading budgets:', e);
        setBudgets({});
      }
    } else {
      setBudgets({});
    }

    // Recargar scripts
    const savedScripts = localStorage.getItem(getUserStorageKey('scripts', userId));
    if (savedScripts) {
      try {
        const parsed = JSON.parse(savedScripts);
        setScripts(Object.keys(parsed).reduce((acc, key) => {
          acc[key] = parsed[key].map((s: Partial<Script> & { lastModified: string | Date }) => ({
            ...s,
            lastModified: new Date(s.lastModified),
          }));
          return acc;
        }, {} as Record<string, Script[]>));
      } catch (e) {
        console.error('Error loading scripts:', e);
        setScripts({});
      }
    } else {
      setScripts({});
    }

    // Recargar documents
    const savedDocuments = localStorage.getItem(getUserStorageKey('documents', userId));
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments);
        setDocuments(Object.keys(parsed).reduce((acc, key) => {
          acc[key] = parsed[key].map((d: Partial<Document> & { uploadedAt: string | Date }) => ({
            ...d,
            uploadedAt: new Date(d.uploadedAt),
          }));
          return acc;
        }, {} as Record<string, Document[]>));
      } catch (e) {
        console.error('Error loading documents:', e);
        setDocuments({});
      }
    } else {
      setDocuments({});
    }

    // Recargar directors
    const savedDirectors = localStorage.getItem(getUserStorageKey('directors', userId));
    if (savedDirectors) {
      try {
        setDirectors(JSON.parse(savedDirectors));
      } catch (e) {
        console.error('Error loading directors:', e);
        setDirectors({});
      }
    } else {
      setDirectors({});
    }

    // Recargar visitors
    const savedVisitors = localStorage.getItem(getUserStorageKey('visitors', userId));
    if (savedVisitors) {
      try {
        const parsed = JSON.parse(savedVisitors);
        setVisitors(Object.keys(parsed).reduce((acc, key) => {
          acc[key] = parsed[key].map((v: Partial<Visitor> & { invitedAt: string | Date }) => ({
            ...v,
            invitedAt: new Date(v.invitedAt),
          }));
          return acc;
        }, {} as Record<string, Visitor[]>));
      } catch (e) {
        console.error('Error loading visitors:', e);
        setVisitors({});
      }
    } else {
      setVisitors({});
    }

    // Recargar tasks con migración para assignedTo (de string a array)
    const savedTasks = localStorage.getItem(getUserStorageKey('tasks', userId));
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(Object.keys(parsed).reduce((acc, key) => {
          acc[key] = parsed[key].map((t: Partial<Task> & { startDate: string | Date; endDate: string | Date; assignedTo?: string | string[] }) => ({
            ...t,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            // Migrar assignedTo de string a array si es necesario
            assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : []),
          }));
          return acc;
        }, {} as Record<string, Task[]>));
      } catch (e) {
        console.error('Error loading tasks:', e);
        setTasks({});
      }
    } else {
      setTasks({});
    }
  }, [userId]); // Solo ejecutar cuando userId cambie

  // Guardar en localStorage cuando cambien los datos
  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('projects', userId), JSON.stringify(projects));
    }
  }, [projects, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('collaborators', userId), JSON.stringify(collaborators));
    }
  }, [collaborators, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('budgets', userId), JSON.stringify(budgets));
    }
  }, [budgets, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('scripts', userId), JSON.stringify(scripts));
    }
  }, [scripts, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('documents', userId), JSON.stringify(documents));
    }
  }, [documents, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('directors', userId), JSON.stringify(directors));
    }
  }, [directors, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('visitors', userId), JSON.stringify(visitors));
    }
  }, [visitors, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('tasks', userId), JSON.stringify(tasks));
    }
  }, [tasks, userId]);

  const addProject = (project: Project) => {
    setProjects([...projects, project]);
    // Inicializar estructuras vacías para el nuevo proyecto
    setCollaborators({ ...collaborators, [project.id]: [] });
    setBudgets({ ...budgets, [project.id]: [] });
    setScripts({ ...scripts, [project.id]: [] });
    setDocuments({ ...documents, [project.id]: [] });
    setVisitors({ ...visitors, [project.id]: [] });
    setTasks({ ...tasks, [project.id]: [] });
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  };

  const addCollaborator = (projectId: string, collaborator: Collaborator) => {
    setCollaborators({
      ...collaborators,
      [projectId]: [...(collaborators[projectId] || []), collaborator],
    });
  };

  const updateCollaborator = (projectId: string, collaboratorId: string, updates: Partial<Collaborator>) => {
    setCollaborators({
      ...collaborators,
      [projectId]: (collaborators[projectId] || []).map(c =>
        c.id === collaboratorId ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCollaborator = (projectId: string, collaboratorId: string) => {
    setCollaborators({
      ...collaborators,
      [projectId]: (collaborators[projectId] || []).filter(c => c.id !== collaboratorId),
    });
  };

  const addBudgetItem = (projectId: string, item: BudgetItem) => {
    setBudgets({
      ...budgets,
      [projectId]: [...(budgets[projectId] || []), item],
    });
  };

  const updateBudgetItem = (projectId: string, itemId: string, updates: Partial<BudgetItem>) => {
    setBudgets({
      ...budgets,
      [projectId]: (budgets[projectId] || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeBudgetItem = (projectId: string, itemId: string) => {
    setBudgets({
      ...budgets,
      [projectId]: (budgets[projectId] || []).filter(item => item.id !== itemId),
    });
  };

  const addScript = (projectId: string, script: Script) => {
    setScripts({
      ...scripts,
      [projectId]: [...(scripts[projectId] || []), script],
    });
  };

  const addDocument = (projectId: string, document: Document) => {
    setDocuments({
      ...documents,
      [projectId]: [...(documents[projectId] || []), document],
    });
  };

  const setDirector = (projectId: string, director: Director) => {
    setDirectors({
      ...directors,
      [projectId]: director,
    });
  };

  const addVisitor = (projectId: string, visitor: Visitor) => {
    setVisitors({
      ...visitors,
      [projectId]: [...(visitors[projectId] || []), visitor],
    });
  };

  const updateVisitor = (projectId: string, visitorId: string, updates: Partial<Visitor>) => {
    setVisitors({
      ...visitors,
      [projectId]: (visitors[projectId] || []).map(v =>
        v.id === visitorId ? { ...v, ...updates } : v
      ),
    });
  };

  const removeVisitor = (projectId: string, visitorId: string) => {
    setVisitors({
      ...visitors,
      [projectId]: (visitors[projectId] || []).filter(v => v.id !== visitorId),
    });
  };

  const removeProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    // También eliminar datos relacionados
    const newCollaborators = { ...collaborators };
    delete newCollaborators[projectId];
    setCollaborators(newCollaborators);

    const newBudgets = { ...budgets };
    delete newBudgets[projectId];
    setBudgets(newBudgets);

    const newScripts = { ...scripts };
    delete newScripts[projectId];
    setScripts(newScripts);

    const newDocuments = { ...documents };
    delete newDocuments[projectId];
    setDocuments(newDocuments);

    const newDirectors = { ...directors };
    delete newDirectors[projectId];
    setDirectors(newDirectors);

    const newVisitors = { ...visitors };
    delete newVisitors[projectId];
    setVisitors(newVisitors);

    const newTasks = { ...tasks };
    delete newTasks[projectId];
    setTasks(newTasks);
  };

  const addTask = (projectId: string, task: Task) => {
    setTasks({
      ...tasks,
      [projectId]: [...(tasks[projectId] || []), task],
    });
  };

  const updateTask = (projectId: string, taskId: string, updates: Partial<Task>) => {
    setTasks({
      ...tasks,
      [projectId]: (tasks[projectId] || []).map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTask = (projectId: string, taskId: string) => {
    setTasks({
      ...tasks,
      [projectId]: (tasks[projectId] || []).filter(t => t.id !== taskId),
    });
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        collaborators,
        budgets,
        scripts,
        documents,
        directors,
        visitors,
        addProject,
        updateProject,
        addCollaborator,
        updateCollaborator,
        removeCollaborator,
        addBudgetItem,
        updateBudgetItem,
        removeBudgetItem,
        addScript,
        addDocument,
        setDirector,
        addVisitor,
        updateVisitor,
        removeVisitor,
        removeProject,
        tasks,
        addTask,
        updateTask,
        removeTask,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
