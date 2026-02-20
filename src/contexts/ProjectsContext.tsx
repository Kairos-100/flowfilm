import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project, Collaborator, BudgetItem, Script, Document, Director, Visitor, Task } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
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
  loading: boolean;
  addProject: (project: Project) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  addCollaborator: (projectId: string, collaborator: Collaborator) => Promise<void>;
  updateCollaborator: (projectId: string, collaboratorId: string, updates: Partial<Collaborator>) => Promise<void>;
  removeCollaborator: (projectId: string, collaboratorId: string) => Promise<void>;
  addBudgetItem: (projectId: string, item: BudgetItem) => Promise<void>;
  updateBudgetItem: (projectId: string, itemId: string, updates: Partial<BudgetItem>) => Promise<void>;
  removeBudgetItem: (projectId: string, itemId: string) => Promise<void>;
  addScript: (projectId: string, script: Script) => Promise<void>;
  addDocument: (projectId: string, document: Document) => Promise<void>;
  setDirector: (projectId: string, director: Director) => Promise<void>;
  addVisitor: (projectId: string, visitor: Visitor) => Promise<void>;
  updateVisitor: (projectId: string, visitorId: string, updates: Partial<Visitor>) => Promise<void>;
  removeVisitor: (projectId: string, visitorId: string) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  addTask: (projectId: string, task: Task) => Promise<void>;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (projectId: string, taskId: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // Migrar datos de localStorage a Supabase (solo una vez)
  const migrateFromLocalStorage = useCallback(async (userId: string) => {
    try {
      // Verificar si ya hay datos en Supabase
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // Si ya hay datos en Supabase, no migrar
      if (existingProjects && existingProjects.length > 0) {
        return;
      }

      // Migrar proyectos
      const savedProjects = localStorage.getItem(getUserStorageKey('projects', userId));
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        const projectsToInsert = parsed.map((p: Partial<Project> & { createdAt: string | Date; updatedAt: string | Date }) => ({
          id: p.id,
          user_id: userId,
          title: p.title,
          description: p.description || null,
          status: p.status,
          category: p.category || 'originals',
          subcategory: p.subcategory || 'feature-film',
          region: p.region || null,
          country: p.country || null,
          created_at: new Date(p.createdAt).toISOString(),
          updated_at: new Date(p.updatedAt).toISOString(),
        }));

        if (projectsToInsert.length > 0) {
          await supabase.from('projects').insert(projectsToInsert);
        }
      }

      // Migrar colaboradores
      const savedCollaborators = localStorage.getItem(getUserStorageKey('collaborators', userId));
      if (savedCollaborators) {
        const parsed = JSON.parse(savedCollaborators);
        const collaboratorsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((c: Collaborator) => {
            collaboratorsToInsert.push({
              id: c.id,
              project_id: projectId,
              name: c.name,
              role: c.role || null,
              email: c.email || null,
              phone: c.phone || null,
              category: c.category || 'studios',
              language: c.language || [],
              address: c.address || null,
              website: c.website || null,
              notes: c.notes || null,
              allergies: c.allergies || null,
              has_driving_license: c.hasDrivingLicense || false,
            });
          });
        });

        if (collaboratorsToInsert.length > 0) {
          await supabase.from('project_collaborators').insert(collaboratorsToInsert);
        }
      }

      // Migrar presupuestos
      const savedBudgets = localStorage.getItem(getUserStorageKey('budgets', userId));
      if (savedBudgets) {
        const parsed = JSON.parse(savedBudgets);
        const budgetsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((item: BudgetItem) => {
            budgetsToInsert.push({
              id: item.id,
              project_id: projectId,
              category: item.category,
              description: item.description,
              amount: item.amount,
              status: item.status,
            });
          });
        });

        if (budgetsToInsert.length > 0) {
          await supabase.from('budget_items').insert(budgetsToInsert);
        }
      }

      // Migrar scripts
      const savedScripts = localStorage.getItem(getUserStorageKey('scripts', userId));
      if (savedScripts) {
        const parsed = JSON.parse(savedScripts);
        const scriptsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((s: Script) => {
            scriptsToInsert.push({
              id: s.id,
              project_id: projectId,
              title: s.title,
              version: s.version,
              content: s.content || null,
              category: s.category || 'script',
              last_modified: new Date(s.lastModified).toISOString(),
            });
          });
        });

        if (scriptsToInsert.length > 0) {
          await supabase.from('scripts').insert(scriptsToInsert);
        }
      }

      // Migrar documentos
      const savedDocuments = localStorage.getItem(getUserStorageKey('documents', userId));
      if (savedDocuments) {
        const parsed = JSON.parse(savedDocuments);
        const documentsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((d: Document) => {
            documentsToInsert.push({
              id: d.id,
              project_id: projectId,
              name: d.name,
              type: d.type,
              category: d.category || null,
              size: d.size,
              is_drive_file: d.isDriveFile || false,
              drive_folder_id: d.driveFolderId || null,
              uploaded_at: new Date(d.uploadedAt).toISOString(),
            });
          });
        });

        if (documentsToInsert.length > 0) {
          await supabase.from('documents').insert(documentsToInsert);
        }
      }

      // Migrar directores
      const savedDirectors = localStorage.getItem(getUserStorageKey('directors', userId));
      if (savedDirectors) {
        const parsed = JSON.parse(savedDirectors);
        const directorsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          const d = parsed[projectId];
          directorsToInsert.push({
            id: d.id,
            project_id: projectId,
            name: d.name,
            email: d.email,
            phone: d.phone || null,
            bio: d.bio || null,
          });
        });

        if (directorsToInsert.length > 0) {
          await supabase.from('directors').insert(directorsToInsert);
        }
      }

      // Migrar visitantes
      const savedVisitors = localStorage.getItem(getUserStorageKey('visitors', userId));
      if (savedVisitors) {
        const parsed = JSON.parse(savedVisitors);
        const visitorsToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((v: Visitor) => {
            visitorsToInsert.push({
              id: v.id,
              project_id: projectId,
              email: v.email,
              name: v.name,
              allowed_tabs: v.allowedTabs,
              status: v.status || 'pending',
              invited_at: new Date(v.invitedAt).toISOString(),
            });
          });
        });

        if (visitorsToInsert.length > 0) {
          await supabase.from('visitors').insert(visitorsToInsert);
        }
      }

      // Migrar tareas
      const savedTasks = localStorage.getItem(getUserStorageKey('tasks', userId));
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        const tasksToInsert: any[] = [];
        
        Object.keys(parsed).forEach((projectId) => {
          parsed[projectId].forEach((t: Task) => {
            tasksToInsert.push({
              id: t.id,
              project_id: projectId,
              description: t.description,
              assigned_to: Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : []),
              start_date: new Date(t.startDate).toISOString().split('T')[0],
              end_date: new Date(t.endDate).toISOString().split('T')[0],
              status: t.status,
            });
          });
        });

        if (tasksToInsert.length > 0) {
          await supabase.from('tasks').insert(tasksToInsert);
        }
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  }, []);

  // Cargar datos desde Supabase
  const loadData = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // Migrar datos de localStorage si es necesario
      await migrateFromLocalStorage(userId);

      // Cargar proyectos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const loadedProjects = (projectsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        category: p.category,
        subcategory: p.subcategory,
        region: p.region,
        country: p.country,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));

      setProjects(loadedProjects);

      // Cargar colaboradores
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('project_collaborators')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id));

      if (!collaboratorsError && collaboratorsData) {
        const loadedCollaborators: Record<string, Collaborator[]> = {};
        collaboratorsData.forEach((c: any) => {
          if (!loadedCollaborators[c.project_id]) {
            loadedCollaborators[c.project_id] = [];
          }
          loadedCollaborators[c.project_id].push({
            id: c.id,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            category: c.category,
            language: c.language || [],
            address: c.address,
            website: c.website,
            notes: c.notes,
            allergies: c.allergies,
            hasDrivingLicense: c.has_driving_license,
          });
        });
        setCollaborators(loadedCollaborators);
      }

      // Cargar presupuestos
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budget_items')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id));

      if (!budgetsError && budgetsData) {
        const loadedBudgets: Record<string, BudgetItem[]> = {};
        budgetsData.forEach((b: any) => {
          if (!loadedBudgets[b.project_id]) {
            loadedBudgets[b.project_id] = [];
          }
          loadedBudgets[b.project_id].push({
            id: b.id,
            category: b.category,
            description: b.description,
            amount: parseFloat(b.amount),
            status: b.status,
          });
        });
        setBudgets(loadedBudgets);
      }

      // Cargar scripts
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('scripts')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id))
        .order('last_modified', { ascending: false });

      if (!scriptsError && scriptsData) {
        const loadedScripts: Record<string, Script[]> = {};
        scriptsData.forEach((s: any) => {
          if (!loadedScripts[s.project_id]) {
            loadedScripts[s.project_id] = [];
          }
          loadedScripts[s.project_id].push({
            id: s.id,
            title: s.title,
            version: s.version,
            lastModified: new Date(s.last_modified),
            content: s.content,
            category: s.category,
          });
        });
        setScripts(loadedScripts);
      }

      // Cargar documentos
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id))
        .order('uploaded_at', { ascending: false });

      if (!documentsError && documentsData) {
        const loadedDocuments: Record<string, Document[]> = {};
        documentsData.forEach((d: any) => {
          if (!loadedDocuments[d.project_id]) {
            loadedDocuments[d.project_id] = [];
          }
          loadedDocuments[d.project_id].push({
            id: d.id,
            name: d.name,
            type: d.type,
            category: d.category,
            uploadedAt: new Date(d.uploaded_at),
            size: d.size,
            isDriveFile: d.is_drive_file,
            driveFolderId: d.drive_folder_id,
          });
        });
        setDocuments(loadedDocuments);
      }

      // Cargar directores
      const { data: directorsData, error: directorsError } = await supabase
        .from('directors')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id));

      if (!directorsError && directorsData) {
        const loadedDirectors: Record<string, Director> = {};
        directorsData.forEach((d: any) => {
          loadedDirectors[d.project_id] = {
            id: d.id,
            name: d.name,
            email: d.email,
            phone: d.phone,
            bio: d.bio,
          };
        });
        setDirectors(loadedDirectors);
      }

      // Cargar visitantes
      const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitors')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id));

      if (!visitorsError && visitorsData) {
        const loadedVisitors: Record<string, Visitor[]> = {};
        visitorsData.forEach((v: any) => {
          if (!loadedVisitors[v.project_id]) {
            loadedVisitors[v.project_id] = [];
          }
          loadedVisitors[v.project_id].push({
            id: v.id,
            email: v.email,
            name: v.name,
            invitedAt: new Date(v.invited_at),
            projectId: v.project_id,
            allowedTabs: v.allowed_tabs || [],
            status: v.status,
          });
        });
        setVisitors(loadedVisitors);
      }

      // Cargar tareas
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', loadedProjects.map(p => p.id))
        .order('start_date', { ascending: true });

      if (!tasksError && tasksData) {
        const loadedTasks: Record<string, Task[]> = {};
        tasksData.forEach((t: any) => {
          if (!loadedTasks[t.project_id]) {
            loadedTasks[t.project_id] = [];
          }
          loadedTasks[t.project_id].push({
            id: t.id,
            description: t.description,
            assignedTo: t.assigned_to || [],
            startDate: new Date(t.start_date),
            endDate: new Date(t.end_date),
            status: t.status,
            projectId: t.project_id,
          });
        });
        setTasks(loadedTasks);
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, [migrateFromLocalStorage]);

  // Cargar datos cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadData(userId);
    } else {
      setProjects([]);
      setCollaborators({});
      setBudgets({});
      setScripts({});
      setDocuments({});
      setDirectors({});
      setVisitors({});
      setTasks({});
      setLoading(false);
    }
  }, [userId, loadData]);

  const addProject = async (project: Project) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('projects').insert({
        id: project.id,
        user_id: userId,
        title: project.title,
        description: project.description || null,
        status: project.status,
        category: project.category,
        subcategory: project.subcategory,
        region: project.region || null,
        country: project.country || null,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
      });

      if (error) throw error;

      setProjects([...projects, project]);
      setCollaborators({ ...collaborators, [project.id]: [] });
      setBudgets({ ...budgets, [project.id]: [] });
      setScripts({ ...scripts, [project.id]: [] });
      setDocuments({ ...documents, [project.id]: [] });
      setVisitors({ ...visitors, [project.id]: [] });
      setTasks({ ...tasks, [project.id]: [] });
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!userId) return;

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
      if (updates.region !== undefined) updateData.region = updates.region || null;
      if (updates.country !== undefined) updateData.country = updates.country || null;

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
      ));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const addCollaborator = async (projectId: string, collaborator: Collaborator) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('project_collaborators').insert({
        id: collaborator.id,
        project_id: projectId,
        name: collaborator.name,
        role: collaborator.role || null,
        email: collaborator.email || null,
        phone: collaborator.phone || null,
        category: collaborator.category,
        language: collaborator.language || [],
        address: collaborator.address || null,
        website: collaborator.website || null,
        notes: collaborator.notes || null,
        allergies: collaborator.allergies || null,
        has_driving_license: collaborator.hasDrivingLicense || false,
      });

      if (error) throw error;

      setCollaborators({
        ...collaborators,
        [projectId]: [...(collaborators[projectId] || []), collaborator],
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  };

  const updateCollaborator = async (projectId: string, collaboratorId: string, updates: Partial<Collaborator>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role || null;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.language !== undefined) updateData.language = updates.language || [];
      if (updates.address !== undefined) updateData.address = updates.address || null;
      if (updates.website !== undefined) updateData.website = updates.website || null;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.allergies !== undefined) updateData.allergies = updates.allergies || null;
      if (updates.hasDrivingLicense !== undefined) updateData.has_driving_license = updates.hasDrivingLicense;

      const { error } = await supabase
        .from('project_collaborators')
        .update(updateData)
        .eq('id', collaboratorId)
        .eq('project_id', projectId);

      if (error) throw error;

      setCollaborators({
        ...collaborators,
        [projectId]: (collaborators[projectId] || []).map(c =>
          c.id === collaboratorId ? { ...c, ...updates } : c
        ),
      });
    } catch (error) {
      console.error('Error updating collaborator:', error);
      throw error;
    }
  };

  const removeCollaborator = async (projectId: string, collaboratorId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId)
        .eq('project_id', projectId);

      if (error) throw error;

      setCollaborators({
        ...collaborators,
        [projectId]: (collaborators[projectId] || []).filter(c => c.id !== collaboratorId),
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  };

  const addBudgetItem = async (projectId: string, item: BudgetItem) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('budget_items').insert({
        id: item.id,
        project_id: projectId,
        category: item.category,
        description: item.description,
        amount: item.amount,
        status: item.status,
      });

      if (error) throw error;

      setBudgets({
        ...budgets,
        [projectId]: [...(budgets[projectId] || []), item],
      });
    } catch (error) {
      console.error('Error adding budget item:', error);
      throw error;
    }
  };

  const updateBudgetItem = async (projectId: string, itemId: string, updates: Partial<BudgetItem>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('budget_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('project_id', projectId);

      if (error) throw error;

      setBudgets({
        ...budgets,
        [projectId]: (budgets[projectId] || []).map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      });
    } catch (error) {
      console.error('Error updating budget item:', error);
      throw error;
    }
  };

  const removeBudgetItem = async (projectId: string, itemId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId)
        .eq('project_id', projectId);

      if (error) throw error;

      setBudgets({
        ...budgets,
        [projectId]: (budgets[projectId] || []).filter(item => item.id !== itemId),
      });
    } catch (error) {
      console.error('Error removing budget item:', error);
      throw error;
    }
  };

  const addScript = async (projectId: string, script: Script) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('scripts').insert({
        id: script.id,
        project_id: projectId,
        title: script.title,
        version: script.version,
        content: script.content || null,
        category: script.category || 'script',
        last_modified: script.lastModified.toISOString(),
      });

      if (error) throw error;

      setScripts({
        ...scripts,
        [projectId]: [...(scripts[projectId] || []), script],
      });
    } catch (error) {
      console.error('Error adding script:', error);
      throw error;
    }
  };

  const addDocument = async (projectId: string, document: Document) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('documents').insert({
        id: document.id,
        project_id: projectId,
        name: document.name,
        type: document.type,
        category: document.category || null,
        size: document.size,
        is_drive_file: document.isDriveFile || false,
        drive_folder_id: document.driveFolderId || null,
        uploaded_at: document.uploadedAt.toISOString(),
      });

      if (error) throw error;

      setDocuments({
        ...documents,
        [projectId]: [...(documents[projectId] || []), document],
      });
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const setDirector = async (projectId: string, director: Director) => {
    if (!userId) return;

    try {
      // Verificar si ya existe un director para este proyecto
      const { data: existing } = await supabase
        .from('directors')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (existing) {
        // Actualizar director existente
        const { error } = await supabase
          .from('directors')
          .update({
            name: director.name,
            email: director.email,
            phone: director.phone || null,
            bio: director.bio || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insertar nuevo director
        const { error } = await supabase.from('directors').insert({
          id: director.id,
          project_id: projectId,
          name: director.name,
          email: director.email,
          phone: director.phone || null,
          bio: director.bio || null,
        });

        if (error) throw error;
      }

      setDirectors({
        ...directors,
        [projectId]: director,
      });
    } catch (error) {
      console.error('Error setting director:', error);
      throw error;
    }
  };

  const addVisitor = async (projectId: string, visitor: Visitor) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('visitors').insert({
        id: visitor.id,
        project_id: projectId,
        email: visitor.email,
        name: visitor.name,
        allowed_tabs: visitor.allowedTabs,
        status: visitor.status || 'pending',
        invited_at: visitor.invitedAt.toISOString(),
      });

      if (error) throw error;

      setVisitors({
        ...visitors,
        [projectId]: [...(visitors[projectId] || []), visitor],
      });
    } catch (error) {
      console.error('Error adding visitor:', error);
      throw error;
    }
  };

  const updateVisitor = async (projectId: string, visitorId: string, updates: Partial<Visitor>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.allowedTabs !== undefined) updateData.allowed_tabs = updates.allowedTabs;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('visitors')
        .update(updateData)
        .eq('id', visitorId)
        .eq('project_id', projectId);

      if (error) throw error;

      setVisitors({
        ...visitors,
        [projectId]: (visitors[projectId] || []).map(v =>
          v.id === visitorId ? { ...v, ...updates } : v
        ),
      });
    } catch (error) {
      console.error('Error updating visitor:', error);
      throw error;
    }
  };

  const removeVisitor = async (projectId: string, visitorId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('visitors')
        .delete()
        .eq('id', visitorId)
        .eq('project_id', projectId);

      if (error) throw error;

      setVisitors({
        ...visitors,
        [projectId]: (visitors[projectId] || []).filter(v => v.id !== visitorId),
      });
    } catch (error) {
      console.error('Error removing visitor:', error);
      throw error;
    }
  };

  const removeProject = async (projectId: string) => {
    if (!userId) return;

    try {
      // Eliminar proyecto (cascada eliminará datos relacionados)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
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
    } catch (error) {
      console.error('Error removing project:', error);
      throw error;
    }
  };

  const addTask = async (projectId: string, task: Task) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('tasks').insert({
        id: task.id,
        project_id: projectId,
        description: task.description,
        assigned_to: task.assignedTo || [],
        start_date: task.startDate.toISOString().split('T')[0],
        end_date: task.endDate.toISOString().split('T')[0],
        status: task.status,
      });

      if (error) throw error;

      setTasks({
        ...tasks,
        [projectId]: [...(tasks[projectId] || []), task],
      });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (projectId: string, taskId: string, updates: Partial<Task>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0];
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('project_id', projectId);

      if (error) throw error;

      setTasks({
        ...tasks,
        [projectId]: (tasks[projectId] || []).map(t =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const removeTask = async (projectId: string, taskId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('project_id', projectId);

      if (error) throw error;

      setTasks({
        ...tasks,
        [projectId]: (tasks[projectId] || []).filter(t => t.id !== taskId),
      });
    } catch (error) {
      console.error('Error removing task:', error);
      throw error;
    }
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
        loading,
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
