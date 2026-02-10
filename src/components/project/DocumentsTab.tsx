import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, File, Download, Calendar, LogIn, X, Filter, Folder, FileText, Check, ChevronDown } from 'lucide-react';
import { Document, Script, DocumentCategory } from '../../types';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { 
  listDriveFiles, 
  listDriveFolders,
  uploadDriveFile, 
  downloadDriveFile, 
  DriveFile 
} from '../../services/googleDrive';
import { useAuth } from '../../contexts/AuthContext';
import { getUserStorageKey } from '../../utils/storage';
import './ProjectTabs.css';

interface DocumentsTabProps {
  documents: Document[];
  scripts: Script[];
  projectId: string;
}

interface CategoryOption {
  value: DocumentCategory | 'all';
  label: string;
}

const defaultCategories: CategoryOption[] = [
  { value: 'all', label: 'All' },
  { value: 'script', label: 'Scripts' },
  { value: 'contract', label: 'Contracts' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'budget', label: 'Budget' },
  { value: 'legal', label: 'Legal' },
  { value: 'production', label: 'Production' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

const formatFileSize = (bytes: number | string | undefined): string => {
  if (!bytes) return '0 B';
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (numBytes < 1024) return numBytes + ' B';
  if (numBytes < 1024 * 1024) return (numBytes / 1024).toFixed(1) + ' KB';
  return (numBytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Detectar categoría por nombre o tipo MIME - mejorado para todas las categorías
function detectCategory(name: string, mimeType: string, availableCategories: CategoryOption[]): DocumentCategory {
  const lowerName = name.toLowerCase();
  
  // Mapa de palabras clave a categorías
  const categoryMap: Record<string, DocumentCategory> = {
    'script': 'script',
    'guion': 'script',
    'screenplay': 'script',
    'contract': 'contract',
    'contrato': 'contract',
    'agreement': 'contract',
    'invoice': 'invoice',
    'factura': 'invoice',
    'bill': 'invoice',
    'budget': 'budget',
    'presupuesto': 'budget',
    'legal': 'legal',
    'production': 'production',
    'produccion': 'production',
    'marketing': 'marketing',
    'promo': 'marketing',
    'publicidad': 'marketing',
  };
  
  // Primero intentar detectar por palabras clave en el nombre
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (lowerName.includes(key)) {
      // Verificar si la categoría existe en las disponibles
      if (availableCategories.find(c => c.value === cat)) {
        return cat;
      }
    }
  }
  
  // Verificar categorías personalizadas en el nombre
  for (const cat of availableCategories) {
    if (cat.value !== 'all' && cat.value !== 'script' && cat.value !== 'other') {
      const catName = cat.label.toLowerCase();
      const catValue = cat.value.toLowerCase();
      if (lowerName.includes(catName) || lowerName.includes(catValue)) {
        return cat.value as DocumentCategory;
      }
    }
  }
  
  // Detectar por tipo MIME
  if (mimeType.includes('document') || mimeType.includes('text') || mimeType.includes('pdf')) {
    const scriptCat = availableCategories.find(c => c.value === 'script');
    if (scriptCat && (mimeType.includes('text/plain') || mimeType.includes('application/vnd.google-apps.document'))) {
      return 'script';
    }
  }
  
  // Por defecto, usar 'other' si existe, sino 'script'
  const otherCat = availableCategories.find(c => c.value === 'other');
  const scriptCat = availableCategories.find(c => c.value === 'script');
  
  if (otherCat) return 'other';
  if (scriptCat) return 'script';
  
  // Si ninguna de las anteriores, usar la primera disponible que no sea 'all'
  const firstCat = availableCategories.find(c => c.value !== 'all');
  return (firstCat?.value as DocumentCategory) || 'other';
}

// Función para convertir nombre a valor (slug)
const nameToValue = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Estilos reutilizables
const dropdownTriggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
  userSelect: 'none',
};

const dropdownMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '4px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '8px',
  minWidth: '200px',
  maxHeight: '400px',
  overflowY: 'auto',
  zIndex: 1000,
  boxShadow: '0 4px 12px var(--shadow)',
};

const categorySelectStyle: React.CSSProperties = {
  background: 'var(--accent)20',
  color: 'var(--accent)',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  border: '1px solid transparent',
  cursor: 'pointer',
};

export default function DocumentsTab({ 
  documents, 
  scripts, 
  projectId 
}: DocumentsTabProps) {
  const { user } = useAuth();
  const { isAuthenticated, accessToken, login, loading } = useGoogleAuth();
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [allDriveFiles, setAllDriveFiles] = useState<DriveFile[]>([]); // Todos los archivos disponibles
  const [driveFolders, setDriveFolders] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderConfig, setShowFolderConfig] = useState(false);
  const [showDriveSelectModal, setShowDriveSelectModal] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<string[]>([]); // IDs de archivos seleccionados de Drive
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [enabledFolders, setEnabledFolders] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(defaultCategories);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('other');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryDropdownOpen]);

  // Cargar categorías personalizadas
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(
        getUserStorageKey(`documentCategories_${projectId}`, user.id)
      );
      if (saved) {
        try {
          const savedCategories = JSON.parse(saved);
          setCategories(savedCategories);
        } catch (e) {
          console.error('Error loading categories:', e);
        }
      }
    }
  }, [projectId, user?.id]);

  // Guardar categorías cuando cambien
  useEffect(() => {
    if (user?.id && categories.length > 0) {
      localStorage.setItem(
        getUserStorageKey(`documentCategories_${projectId}`, user.id),
        JSON.stringify(categories)
      );
    }
  }, [categories, projectId, user?.id]);

  // Funciones de carga de Drive (declaradas antes de los useEffect)
  const loadDriveFolders = useCallback(async () => {
    if (!accessToken) return;
    setLoadingFolders(true);
    try {
      const folders = await listDriveFolders(accessToken);
      setDriveFolders(folders);
    } catch (error) {
      console.error('Error loading Drive folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  }, [accessToken]);

  const loadAllDriveFiles = useCallback(async () => {
    if (!accessToken) return;
    try {
      const files = await listDriveFiles(accessToken);
      setAllDriveFiles(files);
    } catch (error) {
      console.error('Error loading all Drive files:', error);
    }
  }, [accessToken]);

  const loadDriveFiles = useCallback(async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    try {
      const filesFromFolders = enabledFolders.length > 0 
        ? await listDriveFiles(accessToken, enabledFolders) 
        : [];
      
      // Combinar archivos de carpetas + archivos seleccionados individualmente
      const selectedFilesSet = new Set(selectedDriveFiles);
      const selectedFiles = allDriveFiles.filter((f: DriveFile) => selectedFilesSet.has(f.id));
      
      // Combinar y eliminar duplicados usando Map para mejor rendimiento
      const filesMap = new Map<string, DriveFile>();
      filesFromFolders.forEach((file: DriveFile) => filesMap.set(file.id, file));
      selectedFiles.forEach((file: DriveFile) => {
        if (!filesMap.has(file.id)) {
          filesMap.set(file.id, file);
        }
      });
      
      setDriveFiles(Array.from(filesMap.values()));
    } catch (error) {
      console.error('Error loading Drive files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [accessToken, enabledFolders, selectedDriveFiles, allDriveFiles]);

  // Cargar configuración de carpetas del proyecto
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(
        getUserStorageKey(`projectDriveConfig_${projectId}`, user.id)
      );
      if (saved) {
        try {
          const config = JSON.parse(saved);
          setEnabledFolders(config.enabledFolders || []);
          setSelectedDriveFiles(config.selectedFiles || []);
        } catch (e) {
          console.error('Error loading folder config:', e);
        }
      }
    }
  }, [projectId, user?.id]);

  // Cargar carpetas disponibles de Drive
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadDriveFolders();
      loadAllDriveFiles();
    }
  }, [isAuthenticated, accessToken, loadDriveFolders, loadAllDriveFiles]);

  // Cargar archivos de Drive según carpetas seleccionadas y archivos seleccionados
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadDriveFiles();
    }
  }, [isAuthenticated, accessToken, loadDriveFiles]);

  // Función consolidada para guardar configuración
  const saveDriveConfig = useCallback(async (closeModal: () => void, reloadAll = false) => {
    if (!user?.id) return;
    const config = {
      enabledFolders,
      selectedFiles: selectedDriveFiles,
    };
    localStorage.setItem(
      getUserStorageKey(`projectDriveConfig_${projectId}`, user.id),
      JSON.stringify(config)
    );
    closeModal();
    if (reloadAll) {
      await loadAllDriveFiles();
    }
    loadDriveFiles();
  }, [user?.id, projectId, enabledFolders, selectedDriveFiles, loadAllDriveFiles, loadDriveFiles]);

  const handleSaveFolderConfig = useCallback(() => {
    saveDriveConfig(() => setShowFolderConfig(false));
  }, [saveDriveConfig]);

  const handleSaveDriveSelection = useCallback(() => {
    saveDriveConfig(() => setShowDriveSelectModal(false), true);
  }, [saveDriveConfig]);

  const toggleFolder = (folderId: string) => {
    setEnabledFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const toggleDriveFile = (fileId: string) => {
    setSelectedDriveFiles(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.find(c => c.label.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      const value = nameToValue(newCategoryName.trim()) as DocumentCategory;
      setCategories([...categories, { value, label: newCategoryName.trim() }]);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = (categoryValue: string) => {
    if (categoryValue === 'all') return; // No se puede eliminar "All"
    setCategories(categories.filter(c => c.value !== categoryValue));
    if (selectedCategory === categoryValue) {
      setSelectedCategory('all');
    }
  };

  // Función para obtener la categoría guardada de un archivo
  const getSavedCategory = useCallback((fileId: string): DocumentCategory | null => {
    if (!user?.id) return null;
    const key = getUserStorageKey(`documentCategory_${projectId}_${fileId}`, user.id);
    const saved = localStorage.getItem(key);
    return saved as DocumentCategory | null;
  }, [user?.id, projectId]);

  // Función para guardar la categoría de un archivo
  const saveCategory = useCallback((fileId: string, category: DocumentCategory) => {
    if (!user?.id) return;
    const key = getUserStorageKey(`documentCategory_${projectId}_${fileId}`, user.id);
    localStorage.setItem(key, category);
  }, [user?.id, projectId]);

  // Combinar todos los documentos y scripts (optimizado con useMemo)
  const allItems = useMemo<Array<Document & { version?: string; isDriveFile?: boolean; driveFolderId?: string }>>(() => {
    const documentItems = documents.map(doc => ({ 
      ...doc, 
      category: doc.category || detectCategory(doc.name || '', doc.type || '', categories) || 'other' as DocumentCategory 
    }));
    
    const scriptItems = scripts.map(script => ({
      id: script.id,
      name: script.title,
      type: 'text/plain',
      category: 'script' as DocumentCategory,
      uploadedAt: script.lastModified,
      size: 0,
      version: script.version,
    }));
    
    const driveItems = driveFiles.map((file) => {
      const savedCat = getSavedCategory(file.id);
      const detectedCat = savedCat || detectCategory(file.name, file.mimeType, categories);
      
      return {
        id: file.id,
        name: file.name,
        type: file.mimeType,
        size: file.size ? parseInt(file.size) : 0,
        uploadedAt: new Date(file.modifiedTime),
        isDriveFile: true,
        driveFolderId: file.parents?.[0],
        category: detectedCat,
      };
    });
    
    return [...documentItems, ...scriptItems, ...driveItems];
  }, [documents, scripts, driveFiles, categories, getSavedCategory]);

  // Filtrar por categoría seleccionada (optimizado con useMemo)
  const filteredItems = useMemo(() => {
    return selectedCategory === 'all' 
      ? allItems 
      : allItems.filter(item => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    try {
      const folderId = enabledFolders.length > 0 ? enabledFolders[0] : undefined;
      const uploadedFile = await uploadDriveFile(accessToken, file, folderId);
      
      // Guardar la categoría seleccionada para el archivo subido
      if (uploadedFile.id) {
        saveCategory(uploadedFile.id, uploadCategory);
      }
      
      await loadAllDriveFiles();
      await loadDriveFiles();
      setShowUploadModal(false);
      // Resetear la categoría de subida
      setUploadCategory('other');
      // Resetear el input de archivo
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    try {
      const blob = await downloadDriveFile(accessToken, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (fileId: string) => {
    // Verificar si es un archivo de Drive
    const fileToDelete = driveFiles.find(f => f.id === fileId);
    
    if (!fileToDelete) {
      alert('Este archivo no puede ser eliminado. Puede que no sea un archivo de Google Drive.');
      return;
    }

    // Confirmar eliminación (solo de la plataforma, no de Drive)
    if (!window.confirm(
      `¿Estás seguro de que quieres eliminar "${fileToDelete.name}" de este proyecto?\n\n` +
      `El archivo NO se eliminará de Google Drive, solo dejará de mostrarse en este proyecto. ` +
      `Puedes volver a agregarlo más tarde usando "Select from Drive".`
    )) return;
    
    try {
      // NO eliminar de Google Drive, solo de la plataforma
      // Remover de archivos seleccionados
      const newSelectedFiles = selectedDriveFiles.filter(id => id !== fileId);
      setSelectedDriveFiles(newSelectedFiles);
      
      // Guardar la configuración actualizada
      if (user?.id) {
        const config = {
          enabledFolders,
          selectedFiles: newSelectedFiles,
        };
        localStorage.setItem(
          getUserStorageKey(`projectDriveConfig_${projectId}`, user.id),
          JSON.stringify(config)
        );
      }
      
      // Eliminar la categoría guardada
      if (user?.id) {
        const key = getUserStorageKey(`documentCategory_${projectId}_${fileId}`, user.id);
        localStorage.removeItem(key);
      }
      
      // Recargar archivos para actualizar la vista
      await loadAllDriveFiles();
      await loadDriveFiles();
      
      // Mensaje de confirmación
      console.log(`Archivo "${fileToDelete.name}" eliminado del proyecto exitosamente.`);
    } catch (error) {
      console.error('Error removing file from project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el archivo del proyecto.';
      alert(`Error: ${errorMessage}\n\nPor favor, intenta nuevamente.`);
    }
  };

  // Función para cambiar la categoría de un documento existente
  const handleChangeCategory = useCallback((fileId: string, newCategory: DocumentCategory) => {
    saveCategory(fileId, newCategory);
    // No es necesario recargar, useMemo actualizará automáticamente
  }, [saveCategory]);

  if (loading) {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2>Documents</h2>
        </div>
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Documents</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isAuthenticated && (
            <button className="btn-secondary" onClick={login}>
              <LogIn size={18} />
              <span>Connect Google Drive</span>
            </button>
          )}
          {isAuthenticated && (
            <>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowDriveSelectModal(true);
                  // Asegurar que todos los archivos estén cargados antes de abrir el modal
                  if (allDriveFiles.length === 0 && accessToken) {
                    loadAllDriveFiles();
                  }
                }}
                title="Select Files from Google Drive"
              >
                <File size={18} />
                <span>Select from Drive</span>
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowFolderConfig(true)}
                title="Configure Drive Folders"
              >
                <Folder size={18} />
                <span>Folders</span>
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowUploadModal(true)}
              >
          <Plus size={18} />
                <span>Upload</span>
        </button>
            </>
          )}
        </div>
      </div>

      {/* Filtro por categoría - Editable */}
      <div className="document-filter-section">
        <Filter size={16} />
        <div className="filter-dropdown-container" style={{ position: 'relative' }} ref={categoryDropdownRef}>
          <div 
            className="filter-dropdown-trigger"
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            style={dropdownTriggerStyle}
          >
            <span>Categories</span>
            <ChevronDown size={14} />
          </div>
          {isCategoryDropdownOpen && (
            <div 
              className="filter-dropdown-menu"
              style={dropdownMenuStyle}
            >
              {categories.map(cat => (
                <div
                  key={cat.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span 
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setIsCategoryDropdownOpen(false);
                    }}
                    style={{ flex: 1 }}
                  >
                    {cat.label}
                  </span>
                  {cat.value !== 'all' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.value);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        marginLeft: '8px',
                      }}
                      title="Delete category"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {isAddingCategory ? (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                    placeholder="Category name..."
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddCategory}
                    style={{
                      padding: '6px 8px',
                      background: 'var(--accent)',
                      color: 'var(--bg-primary)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
        </div>
      ) : (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '6px 8px',
                    background: 'transparent',
                    color: 'var(--accent)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  <span>Add Category</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="filter-buttons">
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de selección de archivos de Drive */}
      {showDriveSelectModal && (
        <div className="modal-overlay" onClick={() => setShowDriveSelectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Select Files from Google Drive</h2>
              <button className="modal-close" onClick={() => setShowDriveSelectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Select individual files from your Google Drive to display in this project. 
                Files will be automatically categorized based on their name and type.
              </p>
              {loadingFiles && allDriveFiles.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading files from Google Drive...</p>
              ) : allDriveFiles.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  No files found in your Google Drive. Try uploading files first.
                </p>
              ) : (
                <div className="drive-file-select-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {allDriveFiles.map(file => {
                    const detectedCategory = detectCategory(file.name, file.mimeType, categories);
                    const categoryLabel = categories.find(c => c.value === detectedCategory)?.label || detectedCategory;
                    
                    return (
                      <label 
                        key={file.id} 
                        className="drive-file-checkbox"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: selectedDriveFiles.includes(file.id) ? 'var(--golden-overlay)' : 'var(--bg-primary)',
                          marginBottom: '8px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDriveFiles.includes(file.id)}
                          onChange={() => toggleDriveFile(file.id)}
                        />
                        <File size={16} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span style={{ 
                              padding: '2px 6px', 
                              background: 'var(--bg-secondary)', 
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: 'var(--accent)'
                            }}>
                              {categoryLabel}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDriveSelectModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveDriveSelection}>
                Save Selection ({selectedDriveFiles.length} files)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de carpetas */}
      {showFolderConfig && (
        <div className="modal-overlay" onClick={() => setShowFolderConfig(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Configure Google Drive Folders</h2>
              <button className="modal-close" onClick={() => setShowFolderConfig(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Select which folders from your Google Drive should be visible in this project:
              </p>
              {loadingFolders ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading folders...</p>
              ) : (
                <div className="folder-list">
                  {driveFolders.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No folders found in your Google Drive.
                    </p>
                  ) : (
                    driveFolders.map(folder => (
                      <label key={folder.id} className="folder-checkbox">
                        <input
                          type="checkbox"
                          checked={enabledFolders.includes(folder.id)}
                          onChange={() => toggleFolder(folder.id)}
                        />
                        <Folder size={16} />
                        <span>{folder.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowFolderConfig(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveFolderConfig}>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de subida de archivos */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload to Google Drive</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Select File</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  disabled={uploading}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                >
                  {categories
                    .filter(cat => cat.value !== 'all')
                    .map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                </select>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  marginTop: '4px' 
                }}>
                  Select the category for this document. It will be saved and used for filtering.
                </p>
              </div>
              {uploading && <p style={{ color: 'var(--text-secondary)' }}>Uploading...</p>}
            </div>
          </div>
        </div>
      )}

      {loadingFiles && (
        <div className="empty-state">
          <p>Loading files from Google Drive...</p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="empty-state">
          <p>Connect your Google Drive to upload and manage documents</p>
          <button className="btn-primary" onClick={login} style={{ marginTop: '16px' }}>
            <LogIn size={18} />
            <span>Connect Google Drive</span>
          </button>
        </div>
      )}

      {isAuthenticated && enabledFolders.length === 0 && selectedDriveFiles.length === 0 && !loadingFiles && (
        <div className="empty-state">
          <p>No Google Drive folders or files configured for this project.</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text-secondary)' }}>
            Click "Folders" to select Drive folders or "Select from Drive" to choose individual files.
          </p>
        </div>
      )}

      {filteredItems.length === 0 && !loadingFiles && isAuthenticated && (enabledFolders.length > 0 || selectedDriveFiles.length > 0) && (
        <div className="empty-state">
          <p>No documents found in the selected category.</p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="documents-list">
          {filteredItems.map((document) => {
            const isDriveFile = document.isDriveFile;
            const driveFile = isDriveFile ? driveFiles.find(f => f.id === document.id) : null;
            const isScript = document.category === 'script';
            
            return (
            <div key={document.id} className="document-card">
              <div className="document-icon">
                  {isScript ? <FileText size={24} /> : <File size={24} />}
              </div>
              <div className="document-info">
                <h3 className="document-name">{document.name}</h3>
                <div className="document-meta">
                    {document.version && (
                      <>
                        <span className="document-version">Version {document.version}</span>
                        <span className="document-separator">•</span>
                      </>
                    )}
                    {/* Selector de categoría para archivos de Drive */}
                    {isDriveFile ? (
                      <select
                        value={document.category || 'other'}
                        onChange={(e) => handleChangeCategory(document.id, e.target.value as DocumentCategory)}
                        style={categorySelectStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.border = '1px solid var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        {categories
                          .filter(cat => cat.value !== 'all')
                          .map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="document-category" style={{ 
                        background: `var(--accent)20`, 
                        color: 'var(--accent)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {categories.find(c => c.value === document.category)?.label || document.category}
                      </span>
                    )}
                    <span className="document-separator">•</span>
                  <span className="document-type">{document.type}</span>
                    {document.size > 0 && (
                      <>
                  <span className="document-separator">•</span>
                  <span className="document-size">{formatFileSize(document.size)}</span>
                      </>
                    )}
                  <span className="document-separator">•</span>
                  <span className="document-date">
                    <Calendar size={14} />
                      {document.uploadedAt.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                    {isDriveFile && (
                      <>
                        <span className="document-separator">•</span>
                        <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Google Drive</span>
                      </>
                    )}
                </div>
              </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isDriveFile && driveFile?.webViewLink && (
                    <a
                      href={driveFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-action"
                      title="Open in Google Drive"
                    >
                      <File size={18} />
                    </a>
                  )}
                  {isDriveFile && accessToken ? (
                    <>
                      <button
                        className="document-action"
                        onClick={() => handleDownload(document.id, document.name)}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="document-action"
                        onClick={() => handleDelete(document.id)}
                        title="Eliminar del proyecto (no se elimina de Google Drive)"
                        style={{ color: 'var(--error)' }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <button className="document-action" title="Download">
                <Download size={18} />
              </button>
                  )}
                </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
