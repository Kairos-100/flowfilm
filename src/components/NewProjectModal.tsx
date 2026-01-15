import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project, ProjectCategory, ProjectSubcategory } from '../types';
import SimpleCustomSelect from './SimpleCustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { getUserStorageKey } from '../utils/storage';
import './NewProjectModal.css';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingProject?: Project | null;
  onUpdate?: (project: Project) => void;
}

// Removed unused categorySubcategories constant

const defaultCategoryLabels: Record<ProjectCategory, string> = {
  'originals': 'Originals',
  'co-productions': 'Co-productions',
  'commissions': 'Commissions',
};

const defaultSubcategoryLabels: Record<ProjectSubcategory, string> = {
  'feature-film': 'Feature Film',
  'documentary': 'Documentary',
  'audiovisual': 'Audiovisual',
  'tv-series': 'TV Series',
  'short-film': 'Short Film',
  'commercial': 'Commercial',
};

const defaultStatusLabels: Record<string, string> = {
  'pre-produccion': 'Pre-production',
  'produccion': 'In Production',
  'post-produccion': 'Post-production',
  'completado': 'Completed',
};


// Cargar opciones personalizadas desde localStorage
const loadCustomOptions = (key: string, defaults: Record<string, string>, userId: string | null) => {
  try {
    const storageKey = getUserStorageKey(key, userId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const custom = JSON.parse(saved);
      // Si hay algo guardado, usar solo eso (sin mezclar con defaults)
      return custom;
    }
  } catch {}
  // Si no hay nada guardado, usar los defaults y guardarlos
  if (userId) {
    localStorage.setItem(getUserStorageKey(key, userId), JSON.stringify(defaults));
  }
  return defaults;
};

const saveCustomOptions = (key: string, options: Record<string, string>, userId: string | null) => {
  if (userId) {
    localStorage.setItem(getUserStorageKey(key, userId), JSON.stringify(options));
  }
};

export default function NewProjectModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  editingProject,
  onUpdate 
}: NewProjectModalProps) {
  const { user } = useAuth();
  const userId = user?.id || null;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('pre-produccion');
  const [category, setCategory] = useState<string>('originals');
  const [subcategory, setSubcategory] = useState<string>('feature-film');

  // Cargar opciones personalizadas
  const [categoryLabels, setCategoryLabels] = useState(() => 
    loadCustomOptions('customCategories', defaultCategoryLabels, userId)
  );
  const [subcategoryLabels, setSubcategoryLabels] = useState(() => 
    loadCustomOptions('customSubcategories', defaultSubcategoryLabels, userId)
  );
  const [statusLabels, setStatusLabels] = useState(() => 
    loadCustomOptions('customStatuses', defaultStatusLabels, userId)
  );

  // Cargar datos del proyecto si se está editando
  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description || '');
      setStatus(editingProject.status);
      setCategory(editingProject.category);
      setSubcategory(editingProject.subcategory);
    } else {
      setTitle('');
      setDescription('');
      setStatus('pre-produccion');
      setCategory('originals');
      setSubcategory('feature-film');
    }
  }, [editingProject, isOpen]);

  const availableSubcategories = useMemo(() => {
    // Mostrar TODOS los tipos disponibles (por defecto y personalizados)
    // Esto permite que cualquier tipo se use con cualquier categoría
    return Object.keys(subcategoryLabels);
  }, [subcategoryLabels]);

  // Mantener la subcategoría actual si está disponible, o seleccionar la primera disponible
  useEffect(() => {
    if (availableSubcategories.length > 0) {
      // Si la subcategoría actual no está disponible, seleccionar la primera disponible
      if (!availableSubcategories.includes(subcategory)) {
        setSubcategory(availableSubcategories[0]);
      }
      // Si la subcategoría actual está disponible, mantenerla (no hacer nada)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // Solo reaccionar cuando cambie la categoría

  // Preparar opciones para CustomSelect
  const categoryOptions = useMemo(() => {
    return Object.entries(categoryLabels).map(([value, label]) => ({
      value,
      label: String(label),
      isDefault: Object.keys(defaultCategoryLabels).includes(value),
    }));
  }, [categoryLabels]);

  const subcategoryOptions = useMemo(() => {
    return availableSubcategories.map((value) => ({
      value,
      label: subcategoryLabels[value] || value,
      isDefault: Object.keys(defaultSubcategoryLabels).includes(value),
    }));
  }, [availableSubcategories, subcategoryLabels]);

  const statusOptions = useMemo(() => {
    return Object.entries(statusLabels).map(([value, label]) => ({
      value,
      label: String(label),
      isDefault: Object.keys(defaultStatusLabels).includes(value),
    }));
  }, [statusLabels]);

  // Handlers para opciones personalizadas
  const handleAddCategory = (value: string, label: string) => {
    const newLabels = { ...categoryLabels, [value]: label };
    setCategoryLabels(newLabels);
    saveCustomOptions('customCategories', newLabels, userId);
    setCategory(value);
  };

  const handleDeleteCategory = (value: string) => {
    const newLabels = { ...categoryLabels };
    delete newLabels[value];
    setCategoryLabels(newLabels);
    saveCustomOptions('customCategories', newLabels, userId);
    if (category === value) {
      const remainingKeys = Object.keys(newLabels);
      setCategory(remainingKeys.length > 0 ? remainingKeys[0] : 'originals');
    }
  };

  const handleAddSubcategory = (value: string, label: string) => {
    const newLabels = { ...subcategoryLabels, [value]: label };
    setSubcategoryLabels(newLabels);
    saveCustomOptions('customSubcategories', newLabels, userId);
    setSubcategory(value);
  };

  const handleDeleteSubcategory = (value: string) => {
    const newLabels = { ...subcategoryLabels };
    delete newLabels[value];
    setSubcategoryLabels(newLabels);
    saveCustomOptions('customSubcategories', newLabels, userId);
    if (subcategory === value) {
      const remainingKeys = Object.keys(newLabels);
      if (remainingKeys.length > 0) {
        setSubcategory(remainingKeys[0]);
      } else if (availableSubcategories.length > 0) {
        setSubcategory(availableSubcategories[0]);
      }
    }
  };

  const handleAddStatus = (value: string, label: string) => {
    const newLabels = { ...statusLabels, [value]: label };
    setStatusLabels(newLabels);
    saveCustomOptions('customStatuses', newLabels, userId);
    setStatus(value as any);
  };

  const handleDeleteStatus = (value: string) => {
    const newLabels = { ...statusLabels };
    delete newLabels[value];
    setStatusLabels(newLabels);
    saveCustomOptions('customStatuses', newLabels, userId);
    if (status === value) {
      const remainingKeys = Object.keys(newLabels);
      setStatus(remainingKeys.length > 0 ? remainingKeys[0] : 'pre-produccion');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      if (editingProject && onUpdate) {
        // Modo edición
        onUpdate({
          ...editingProject,
          title: title.trim(),
          description: description.trim() || undefined,
          status: status as 'pre-produccion' | 'produccion' | 'post-produccion' | 'completado',
          category: category as ProjectCategory,
          subcategory: subcategory as ProjectSubcategory,
          updatedAt: new Date(),
        });
      } else {
        // Modo creación
        onCreate({
          title: title.trim(),
          description: description.trim() || undefined,
          status: status as 'pre-produccion' | 'produccion' | 'post-produccion' | 'completado',
          category: category as ProjectCategory,
          subcategory: subcategory as ProjectSubcategory,
        });
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus('pre-produccion');
    setCategory('originals');
    setSubcategory('feature-film');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <SimpleCustomSelect
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              label="Category *"
              onAddOption={handleAddCategory}
              onDeleteOption={handleDeleteCategory}
              allowCustom={true}
              placeholder="Select category..."
            />

            <SimpleCustomSelect
              value={subcategory}
              onChange={setSubcategory}
              options={subcategoryOptions}
              label="Type *"
              onAddOption={handleAddSubcategory}
              onDeleteOption={handleDeleteSubcategory}
              allowCustom={true}
              placeholder="Select type..."
            />
          </div>

          <div className="form-row">
            <SimpleCustomSelect
              value={status}
              onChange={(value) => setStatus(value as any)}
              options={statusOptions}
              label="Stage *"
              onAddOption={handleAddStatus}
              onDeleteOption={handleDeleteStatus}
              allowCustom={true}
              placeholder="Select stage..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
