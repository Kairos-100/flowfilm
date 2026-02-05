import { useState, useMemo } from 'react';
import { Plus, Mail, Phone, Globe, Trash2, Edit2, Languages, Users, AlertTriangle, Car } from 'lucide-react';
import { Collaborator, CollaboratorCategory } from '../types';
import AddCollaboratorModal from '../components/project/AddCollaboratorModal';
import { useContacts } from '../contexts/ContactsContext';
import '../components/project/ProjectTabs.css';
import './Contacts.css';

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

export default function Contacts() {
  const { globalContacts, addGlobalContact, updateGlobalContactById, removeGlobalContact } = useContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Collaborator | null>(null);

  const contactsByCategory = useMemo(() => {
    const grouped: Record<CollaboratorCategory, Collaborator[]> = {
      'coproducers': [],
      'distributor-companies': [],
      'studios': [],
      'equipment-companies': [],
      'locations': [],
    };

    // Separar contactos normales de visitantes
    const regularContacts = globalContacts.filter(c => !c.isVisitor);
    
    regularContacts.forEach((contact) => {
      if (grouped[contact.category]) {
        grouped[contact.category].push(contact);
      }
    });

    return grouped;
  }, [globalContacts]);

  const visitors = useMemo(() => {
    return globalContacts.filter(c => c.isVisitor);
  }, [globalContacts]);

  const handleAdd = (contact: Omit<Collaborator, 'id'>) => {
    addGlobalContact(contact);
    setIsModalOpen(false);
  };

  const handleEdit = (contact: Collaborator) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleUpdate = (contact: Omit<Collaborator, 'id'>) => {
    if (editingContact) {
      updateGlobalContactById(editingContact.id, contact);
      setEditingContact(null);
      setIsModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <div className="contacts-header-left">
          <Users size={24} />
          <h1>Contacts</h1>
        </div>
        <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="tab-content">
        {globalContacts.length === 0 ? (
          <div className="empty-state">
            <p>No contacts added yet.</p>
            <p className="empty-state-subtitle">Add your first contact to get started.</p>
          </div>
        ) : (
          <div className="collaborators-by-category">
            {categoryOrder.map((category) => {
              const categoryContacts = contactsByCategory[category];
              if (categoryContacts.length === 0) return null;

              return (
                <div key={category} className="category-section">
                  <h3 className="category-section-title">{categoryLabels[category]}</h3>
                  <div className="collaborators-list">
                    {categoryContacts.map((contact) => (
                      <div key={contact.id} className="collaborator-card">
                        <div className="collaborator-avatar">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="collaborator-info">
                          <h3 className="collaborator-name">{contact.name}</h3>
                          {contact.role && (
                            <p className="collaborator-role">{contact.role}</p>
                          )}
                          {(() => {
                            // Manejar compatibilidad con datos antiguos (string) y nuevos (array)
                            const languages = Array.isArray(contact.language) 
                              ? contact.language 
                              : (typeof contact.language === 'string' ? [contact.language] : []);
                            
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
                          {contact.address && (
                            <p className="collaborator-address">{contact.address}</p>
                          )}
                          <div className="collaborator-contact">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="contact-link">
                                <Mail size={14} />
                                <span>{contact.email}</span>
                              </a>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="contact-link">
                                <Phone size={14} />
                                <span>{contact.phone}</span>
                              </a>
                            )}
                            {contact.website && (
                              <a
                                href={contact.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-link"
                              >
                                <Globe size={14} />
                                <span>Website</span>
                              </a>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="collaborator-notes">{contact.notes}</p>
                          )}
                          {contact.allergies && (
                            <p className="collaborator-allergies" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <AlertTriangle size={14} />
                              <span><strong>Allergies:</strong> {contact.allergies}</span>
                            </p>
                          )}
                          {contact.hasDrivingLicense && (
                            <p className="collaborator-license" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <Car size={14} />
                              <span>Has Driving License</span>
                            </p>
                          )}
                        </div>
                        <div className="collaborator-actions">
                          <button
                            className="action-button"
                            onClick={() => handleEdit(contact)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="action-button danger"
                            onClick={() => removeGlobalContact(contact.id)}
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
                      onClick={() => removeGlobalContact(visitor.id)}
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
          onAdd={editingContact ? handleUpdate : handleAdd}
          editingCollaborator={editingContact}
        />
      </div>
    </div>
  );
}
