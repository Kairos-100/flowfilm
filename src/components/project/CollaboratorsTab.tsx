import { useState, useMemo } from 'react';
import { Plus, Mail, Phone, Globe, Trash2, Edit2, Languages, AlertTriangle, Car } from 'lucide-react';
import { Collaborator, CollaboratorCategory, Visitor } from '../../types';
import AddCollaboratorModal from './AddCollaboratorModal';
import './ProjectTabs.css';

// Language code to name and flag mapping
const languageMap: Record<string, { name: string; flag: string }> = {
  'es': { name: 'Spanish', flag: '🇪🇸' },
  'en': { name: 'English', flag: '🇬🇧' },
  'fr': { name: 'French', flag: '🇫🇷' },
  'de': { name: 'German', flag: '🇩🇪' },
  'it': { name: 'Italian', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', flag: '🇵🇹' },
  'zh': { name: 'Chinese', flag: '🇨🇳' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean', flag: '🇰🇷' },
  'ar': { name: 'Arabic', flag: '🇸🇦' },
  'ru': { name: 'Russian', flag: '🇷🇺' },
  'hi': { name: 'Hindi', flag: '🇮🇳' },
  'nl': { name: 'Dutch', flag: '🇳🇱' },
  'sv': { name: 'Swedish', flag: '🇸🇪' },
  'pl': { name: 'Polish', flag: '🇵🇱' },
  'tr': { name: 'Turkish', flag: '🇹🇷' },
  'th': { name: 'Thai', flag: '🇹🇭' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳' },
};

interface CollaboratorsTabProps {
  collaborators: Collaborator[];
  onAdd: (collaborator: Omit<Collaborator, 'id'>) => Promise<void> | void;
  onUpdate: (collaboratorId: string, updates: Partial<Collaborator>) => Promise<void> | void;
  onRemove: (collaboratorId: string) => Promise<void> | void;
  projectId?: string;
  onAddVisitor?: (projectId: string, visitor: Visitor) => Promise<void> | void;
}

const categoryLabels: Record<CollaboratorCategory, string> = {
  'coproducers': 'Coproducers',
  'distributor-companies': 'Distributor Companies',
  'studios': 'Studios',
  'equipment-companies': 'Equipment Companies',
  'locations': 'Locations',
};

const categoryOrder: CollaboratorCategory[] = [
  'coproducers',
  'distributor-companies',
  'studios',
  'equipment-companies',
  'locations',
];

export default function CollaboratorsTab({
  collaborators,
  onAdd,
  onUpdate,
  onRemove,
  projectId,
  onAddVisitor,
}: CollaboratorsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

  const collaboratorsByCategory = useMemo(() => {
    const grouped: Record<CollaboratorCategory, Collaborator[]> = {
      'coproducers': [],
      'distributor-companies': [],
      'studios': [],
      'equipment-companies': [],
      'locations': [],
    };

    // Separar colaboradores normales de visitantes
    const regularCollaborators = collaborators.filter(c => !c.isVisitor);
    
    regularCollaborators.forEach((collab) => {
      if (grouped[collab.category]) {
        grouped[collab.category].push(collab);
      }
    });

    return grouped;
  }, [collaborators]);

  const visitors = useMemo(() => {
    return collaborators.filter(c => c.isVisitor);
  }, [collaborators]);

  const handleAdd = async (collaborator: Omit<Collaborator, 'id'>) => {
    try {
      await onAdd(collaborator);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };

  const handleEdit = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setIsModalOpen(true);
  };

  const handleUpdate = async (collaborator: Omit<Collaborator, 'id'>) => {
    if (editingCollaborator) {
      try {
        await onUpdate(editingCollaborator.id, collaborator);
        setEditingCollaborator(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error updating collaborator:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollaborator(null);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Collaborators</h2>
        <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add Contact</span>
        </button>
      </div>

      {collaborators.length === 0 ? (
        <div className="empty-state">
          <p>No contacts added yet.</p>
        </div>
      ) : (
        <div className="collaborators-by-category">
          {categoryOrder.map((category) => {
            const categoryCollaborators = collaboratorsByCategory[category];
            if (categoryCollaborators.length === 0) return null;

            return (
              <div key={category} className="category-section">
                <h3 className="category-section-title">{categoryLabels[category]}</h3>
                <div className="collaborators-list">
                  {categoryCollaborators.map((collaborator) => (
                    <div key={collaborator.id} className="collaborator-card">
                      <div className="collaborator-avatar">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="collaborator-info">
                        <h3 className="collaborator-name">{collaborator.name}</h3>
                        {collaborator.role && (
                          <p className="collaborator-role">{collaborator.role}</p>
                        )}
                        {(() => {
                          // Manejar compatibilidad con datos antiguos (string) y nuevos (array)
                          const languages = Array.isArray(collaborator.language) 
                            ? collaborator.language 
                            : (typeof collaborator.language === 'string' ? [collaborator.language] : []);
                          
                          if (languages.length > 0) {
                            return (
                              <p className="collaborator-language">
                                <Languages size={14} />
                                {languages.map((langCode, index) => {
                                  const lang = languageMap[langCode];
                                  return lang ? (
                                    <span key={langCode}>
                                      {lang.name}
                                      {index < languages.length - 1 && ', '}
                                    </span>
                                  ) : null;
                                })}
                              </p>
                            );
                          }
                          return null;
                        })()}
                        {collaborator.address && (
                          <p className="collaborator-address">{collaborator.address}</p>
                        )}
                        <div className="collaborator-contact">
                          {collaborator.email && (
                            <a href={`mailto:${collaborator.email}`} className="contact-link">
                              <Mail size={14} />
                              <span>{collaborator.email}</span>
                            </a>
                          )}
                          {collaborator.phone && (
                            <a href={`tel:${collaborator.phone}`} className="contact-link">
                              <Phone size={14} />
                              <span>{collaborator.phone}</span>
                            </a>
                          )}
                          {collaborator.website && (
                            <a
                              href={collaborator.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contact-link"
                            >
                              <Globe size={14} />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                        {collaborator.notes && (
                          <p className="collaborator-notes">{collaborator.notes}</p>
                        )}
                        {collaborator.allergies && (
                          <p className="collaborator-allergies" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            <AlertTriangle size={14} />
                            <span><strong>Allergies:</strong> {collaborator.allergies}</span>
                          </p>
                        )}
                        {collaborator.hasDrivingLicense && (
                          <p className="collaborator-license" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            <Car size={14} />
                            <span>Has Driving License</span>
                          </p>
                        )}
                      </div>
                      <div className="collaborator-actions">
                        <button
                          className="action-button"
                          onClick={() => handleEdit(collaborator)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-button danger"
                          onClick={async () => {
                            if (confirm('¿Estás seguro de que quieres eliminar este colaborador?')) {
                              try {
                                await onRemove(collaborator.id);
                              } catch (error) {
                                console.error('Error removing collaborator:', error);
                                alert('Error al eliminar el colaborador. Por favor, intenta de nuevo.');
                              }
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visitors Section */}
      {visitors.length > 0 && (
        <div className="category-section" style={{ marginTop: '32px' }}>
          <h3 className="category-section-title">Visitors</h3>
          <div className="collaborators-list">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="collaborator-card">
                <div className="collaborator-avatar">
                  {visitor.name.charAt(0).toUpperCase()}
                </div>
                <div className="collaborator-info">
                  <h3 className="collaborator-name">{visitor.name}</h3>
                  <p className="collaborator-role">Visitor</p>
                  {visitor.email && (
                    <div className="collaborator-contact">
                      <a href={`mailto:${visitor.email}`} className="contact-link">
                        <Mail size={14} />
                        <span>{visitor.email}</span>
                      </a>
                    </div>
                  )}
                  {visitor.allowedTabs && visitor.allowedTabs.length > 0 && (
                    <div className="visitor-tabs-section" style={{ marginTop: '8px' }}>
                      <div className="tabs-label" style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Allowed tabs:</div>
                      <div className="visitor-tabs-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {visitor.allowedTabs.map((tabId) => {
                          const tabLabels: Record<string, string> = {
                            'colaboradores': 'Collaborators',
                            'tareas': 'Tasks',
                            'documentos': 'Documents',
                            'budget': 'Budget',
                          };
                          return (
                            <span key={tabId} className="visitor-tab-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {tabLabels[tabId] || tabId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="collaborator-actions">
                  <button
                    className="action-button"
                    onClick={() => handleEdit(visitor)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-button danger"
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que quieres eliminar este visitante?')) {
                        try {
                          await onRemove(visitor.id);
                        } catch (error) {
                          console.error('Error removing visitor:', error);
                          alert('Error al eliminar el visitante. Por favor, intenta de nuevo.');
                        }
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddCollaboratorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={editingCollaborator ? handleUpdate : handleAdd}
        editingCollaborator={editingCollaborator}
        projectId={projectId}
        onAddVisitor={onAddVisitor}
      />
    </div>
  );
}
