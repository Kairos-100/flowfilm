import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Project } from '../types';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserStorageKey } from '../utils/storage';
import NewProjectModal from '../components/NewProjectModal';
import ProjectCardMenu from '../components/ProjectCardMenu';
import { useState, useMemo } from 'react';
import './Home.css';

// Removed unused statusColors and statusLabels constants

const defaultCategoryLabels: Record<string, string> = {
  'originals': 'Originals',
  'co-productions': 'Co-productions',
  'commissions': 'Commissions',
};

const defaultSubcategoryLabels: Record<string, string> = {
  'feature-film': 'Feature Film',
  'documentary': 'Documentary',
  'audiovisual': 'Audiovisual',
  'tv-series': 'TV Series',
  'short-film': 'Short Film',
  'commercial': 'Commercial',
};

// Cargar opciones personalizadas desde localStorage
const loadCustomOptions = (key: string, defaults: Record<string, string>, userId: string | null) => {
  try {
    const storageKey = getUserStorageKey(key, userId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const custom = JSON.parse(saved);
      return custom;
    }
  } catch {
    // Ignore parse errors, fall back to defaults
  }
  return defaults;
};

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const { projects, addProject, updateProject, removeProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Cargar categorías y subcategorías personalizadas
  const categoryLabels = useMemo(() => 
    loadCustomOptions('customCategories', defaultCategoryLabels, userId),
    [userId]
  );
  const subcategoryLabels = useMemo(() => 
    loadCustomOptions('customSubcategories', defaultSubcategoryLabels, userId),
    [userId]
  );

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addProject(newProject);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleUpdateProject = (project: Project) => {
    updateProject(project.id, project);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    removeProject(projectId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  // Organizar proyectos por categoría y subcategoría
  const projectsByCategory = projects.reduce((acc, project) => {
    const category = project.category || 'originals';
    const subcategory = project.subcategory || 'feature-film';
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][subcategory]) {
      acc[category][subcategory] = [];
    }
    acc[category][subcategory].push(project);
    return acc;
  }, {} as Record<string, Record<string, Project[]>>);

  // Obtener todas las categorías (por defecto + personalizadas) que tienen proyectos
  const categories = useMemo(() => {
    const categoryKeys = Object.keys(projectsByCategory);
    const categoryList = categoryKeys.map(key => ({
      key,
      label: (categoryLabels[key] || key).toUpperCase(),
    }));
    
    // Definir el orden de prioridad para las categorías
    const categoryOrder = ['originals', 'co-productions', 'commissions'];
    
    // Ordenar: primero las categorías por defecto en el orden especificado, luego las personalizadas
    return categoryList.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.key);
      const bIndex = categoryOrder.indexOf(b.key);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.key.localeCompare(b.key);
    });
  }, [projectsByCategory, categoryLabels]);

  // Obtener todas las subcategorías disponibles para cada categoría
  const getSubcategoriesForCategory = (categoryKey: string) => {
    const categoryProjects = projectsByCategory[categoryKey] || {};
    // Obtener todas las subcategorías que tienen proyectos en esta categoría
    const subcategoryKeys = Object.keys(categoryProjects);
    // Ordenar: primero las por defecto en orden, luego las personalizadas
    const defaultOrder = ['feature-film', 'documentary', 'audiovisual', 'tv-series', 'short-film', 'commercial'];
    const ordered = subcategoryKeys.sort((a, b) => {
      const aIndex = defaultOrder.indexOf(a);
      const bIndex = defaultOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
    return ordered;
  };

  return (
    <div className="home">
      <div className="home-header">
        <h1>PROJECTS</h1>
        <button className="btn-primary minimal" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      <div className="projects-columns">
        {categories.map((category) => {
          const categoryProjects = projectsByCategory[category.key] || {};
          const hasProjects = Object.values(categoryProjects).some(arr => arr.length > 0);
          
          if (!hasProjects) return null;

          const subcategories = getSubcategoriesForCategory(category.key);

          return (
            <div key={category.key} className="category-column">
              <h2 className="category-title">{category.label}</h2>
              {subcategories.map((subcategoryKey) => {
                const subcategoryProjects = categoryProjects[subcategoryKey] || [];
                if (subcategoryProjects.length === 0) return null;

                return (
                  <div key={subcategoryKey} className="subcategory-section">
                    <h3 className="subcategory-title">
                      {subcategoryLabels[subcategoryKey]?.toUpperCase() || subcategoryKey.toUpperCase()}
                    </h3>
                    <ul className="project-list">
                      {subcategoryProjects.map((project) => (
                        <li key={project.id} className="project-item">
                          <div className="project-item-content">
                            <Link to={`/project/${project.id}`} className="project-link">
                              {project.title}
                            </Link>
                            <ProjectCardMenu
                              onEdit={() => handleEditProject(project)}
                              onDelete={() => handleDeleteProject(project.id)}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateProject}
        editingProject={editingProject}
        onUpdate={handleUpdateProject}
      />
    </div>
  );
}
