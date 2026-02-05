import { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { Collaborator, CollaboratorCategory, TabType, Visitor, Project } from '../../types';
import SimpleCustomSelect from '../SimpleCustomSelect';
import { useContacts } from '../../contexts/ContactsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { getUserStorageKey } from '../../utils/storage';
import { sendGmailMessage } from '../../services/gmail';
import './ProjectTabs.css';

const allTabs: { id: TabType; label: string }[] = [
  { id: 'colaboradores', label: 'Collaborators' },
  { id: 'tareas', label: 'Tasks' },
  { id: 'documentos', label: 'Documents' },
  { id: 'budget', label: 'Budget' },
];

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (collaborator: Omit<Collaborator, 'id'>) => void;
  editingCollaborator?: Collaborator | null;
  projectId?: string;
  onAddVisitor?: (projectId: string, visitor: Visitor) => void;
  projects?: Project[];
  onAddToProject?: (projectId: string, collaborator: Omit<Collaborator, 'id'>) => void;
}

const defaultCategoryLabels: Record<CollaboratorCategory, string> = {
  'coproducers': 'Coproducers',
  'distributor-companies': 'Distributor Companies',
  'studios': 'Studios',
  'equipment-companies': 'Equipment Companies',
  'locations': 'Locations',
};

// Cargar y guardar opciones personalizadas
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

// Most common languages for communication
const languageOptions = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
];

export default function AddCollaboratorModal({ isOpen, onClose, onAdd, editingCollaborator, projectId, onAddVisitor, projects, onAddToProject }: AddCollaboratorModalProps) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const { findContactByName, searchContactsByName, addGlobalContact } = useContacts();
  const { isAuthenticated, accessToken } = useGoogleAuth();
  const [category, setCategory] = useState<string>('coproducers');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const [customLanguageInput, setCustomLanguageInput] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [hasDrivingLicense, setHasDrivingLicense] = useState(false);
  const [allowedTabs, setAllowedTabs] = useState<TabType[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<Collaborator[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Cargar opciones personalizadas
  const [categoryLabels, setCategoryLabels] = useState(() => 
    loadCustomOptions('customCollaboratorCategories', defaultCategoryLabels, userId)
  );

  // Preparar opciones para SimpleCustomSelect
  const categoryOptions = useMemo(() => {
    return Object.entries(categoryLabels).map(([value, label]) => ({
      value,
      label: String(label),
      isDefault: Object.keys(defaultCategoryLabels).includes(value),
    }));
  }, [categoryLabels]);

  // Handlers para opciones personalizadas
  const handleAddCategory = (value: string, label: string) => {
    const newLabels = { ...categoryLabels, [value]: label };
    setCategoryLabels(newLabels);
    saveCustomOptions('customCollaboratorCategories', newLabels, userId);
    setCategory(value);
  };

  const handleDeleteCategory = (value: string) => {
    const newLabels = { ...categoryLabels };
    delete newLabels[value];
    setCategoryLabels(newLabels);
    saveCustomOptions('customCollaboratorCategories', newLabels, userId);
    if (category === value) {
      const remainingKeys = Object.keys(newLabels);
      setCategory(remainingKeys.length > 0 ? remainingKeys[0] : 'coproducers');
    }
  };

  // Efecto para buscar sugerencias cuando cambie el nombre (solo si no hay coincidencia exacta)
  useEffect(() => {
    if (name.trim() && !editingCollaborator && isOpen) {
      const exactMatch = findContactByName(name);
      if (!exactMatch) {
        // Solo mostrar sugerencias si no hay coincidencia exacta
        const suggestions = searchContactsByName(name);
        setNameSuggestions(suggestions);
        setShowNameSuggestions(suggestions.length > 0);
      } else {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
      }
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
    }
  }, [name, editingCollaborator, isOpen, searchContactsByName, findContactByName]);

  // Cargar datos si se está editando
  useEffect(() => {
    if (editingCollaborator && isOpen) {
      setCategory(editingCollaborator.category as string);
      setName(editingCollaborator.name);
      setRole(editingCollaborator.role || '');
      setEmail(editingCollaborator.email || '');
      setPhone(editingCollaborator.phone || '');
      // Manejar tanto array como string (para compatibilidad con datos antiguos)
      if (Array.isArray(editingCollaborator.language)) {
        setLanguages(editingCollaborator.language);
      } else if (typeof editingCollaborator.language === 'string') {
        setLanguages([editingCollaborator.language]);
      } else {
        setLanguages([]);
      }
      setAddress(editingCollaborator.address || '');
      setWebsite(editingCollaborator.website || '');
      setNotes(editingCollaborator.notes || '');
      setAllergies(editingCollaborator.allergies || '');
      setHasDrivingLicense(editingCollaborator.hasDrivingLicense || false);
      setAllowedTabs(editingCollaborator.allowedTabs || []);
    } else if (!editingCollaborator && isOpen) {
      resetForm();
    }
  }, [editingCollaborator, isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isLanguagesOpen && !target.closest('.languages-dropdown-wrapper')) {
        setIsLanguagesOpen(false);
      }
    };

    if (isLanguagesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isLanguagesOpen]);

  // Función auxiliar para autocompletar campos del contacto
  const fillContactFields = (contact: Collaborator) => {
    setEmail(contact.email || '');
    setRole(contact.role || '');
    setPhone(contact.phone || '');
    setAddress(contact.address || '');
    setWebsite(contact.website || '');
    setNotes(contact.notes || '');
    setAllergies(contact.allergies || '');
    setHasDrivingLicense(contact.hasDrivingLicense || false);
    if (contact.language) {
      setLanguages(Array.isArray(contact.language)
        ? contact.language
        : (typeof contact.language === 'string' ? [contact.language] : []));
    } else {
      setLanguages([]);
    }
    if (contact.allowedTabs) {
      setAllowedTabs(contact.allowedTabs);
    } else {
      setAllowedTabs([]);
    }
    setCategory(contact.category);
  };

  // Handler para cuando cambie el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Si estamos editando, no autocompletar
    if (editingCollaborator) {
      return;
    }
    
    if (newName.trim()) {
      // Buscar coincidencia exacta primero
      const exactMatch = findContactByName(newName);
      if (exactMatch) {
        fillContactFields(exactMatch);
        setShowNameSuggestions(false);
      } else {
        // Si no hay coincidencia exacta, buscar sugerencias
        const suggestions = searchContactsByName(newName);
        setNameSuggestions(suggestions);
        setShowNameSuggestions(suggestions.length > 0);
        
        // Si solo hay una sugerencia y el nombre coincide completamente, autocompletar
        if (suggestions.length === 1 && suggestions[0].name.toLowerCase() === newName.toLowerCase().trim()) {
          fillContactFields(suggestions[0]);
          setShowNameSuggestions(false);
        }
      }
    } else {
      // Si el campo está vacío, limpiar sugerencias
      setShowNameSuggestions(false);
      setNameSuggestions([]);
    }
  };

  const handleToggleLanguage = (langCode: string) => {
    setLanguages(prev => {
      if (prev.includes(langCode)) {
        return prev.filter(l => l !== langCode);
      } else {
        return [...prev, langCode];
      }
    });
  };

  const handleAddCustomLanguage = () => {
    const customLang = customLanguageInput.trim();
    if (customLang && !languages.includes(customLang)) {
      setLanguages(prev => [...prev, customLang]);
      setCustomLanguageInput('');
    }
  };

  const handleRemoveLanguage = (langCode: string) => {
    setLanguages(prev => prev.filter(l => l !== langCode));
  };

  const handleToggleTab = (tabId: TabType) => {
    if (allowedTabs.includes(tabId)) {
      setAllowedTabs(allowedTabs.filter((id) => id !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

  const generateInviteToken = (): string => {
    // Generar un token único basado en timestamp y random
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleInviteCollaborator = async () => {
    if (!projectId || !email.trim() || allowedTabs.length === 0 || !onAddVisitor) {
      return;
    }

    try {
      // Generar token único para la invitación
      const inviteToken = generateInviteToken();
      
      // Crear el Visitor
      const visitor: Visitor = {
        id: inviteToken,
        email: email.trim(),
        name: name.trim(),
        invitedAt: new Date(),
        projectId: projectId,
        allowedTabs: allowedTabs,
        status: 'pending',
      };

      // Añadir el visitante
      onAddVisitor(projectId, visitor);

      // Guardar información de invitación en sessionStorage para acceso cruzado
      sessionStorage.setItem(`invite_data_${inviteToken}`, JSON.stringify({
        email: email.trim(),
        allowedTabs: allowedTabs,
        projectId: projectId,
        name: name.trim(),
      }));

      // Generar enlace de invitación
      const inviteUrl = `${window.location.origin}/project/${projectId}?invite=${inviteToken}&email=${encodeURIComponent(email.trim())}`;

      // Intentar enviar email si Gmail está conectado
      if (isAuthenticated && accessToken) {
        try {
          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">You've been invited to collaborate</h2>
              <p>Hello ${name.trim()},</p>
              <p>You have been invited to collaborate on this project with access to the following sections:</p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${allowedTabs.map(tab => {
                  const tabLabels: Record<TabType, string> = {
                    'colaboradores': 'Collaborators',
                    'tareas': 'Tasks',
                    'documentos': 'Documents',
                    'budget': 'Budget',
                  };
                  return `<li style="padding: 5px 0;">✓ ${tabLabels[tab] || tab}</li>`;
                }).join('')}
              </ul>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 12px;">Or copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
            </div>
          `;

          await sendGmailMessage(
            accessToken,
            email.trim(),
            `Invitation to collaborate on project`,
            emailBody
          );
          
          // Mostrar mensaje de éxito
          alert('¡Invitación enviada por email exitosamente!');
        } catch (error) {
          console.error('Error sending email:', error);
          // Si falla el envío de email, copiar al portapapeles
          await navigator.clipboard.writeText(inviteUrl);
          alert('No se pudo enviar el email, pero el enlace de invitación ha sido copiado al portapapeles.');
        }
      } else {
        // Si no hay Gmail conectado, copiar al portapapeles
        await navigator.clipboard.writeText(inviteUrl);
        alert('¡Enlace de invitación copiado al portapapeles! Compártelo con el colaborador.');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Error al crear la invitación. Por favor, inténtalo de nuevo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Solo es visitante si la categoría explícitamente contiene "visitante"
      // Las pestañas permitidas son independientes de la categoría
      const isVisitor = category.toLowerCase().includes('visitante');
      
      const collaboratorData = {
        name: name.trim(),
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        category: category as CollaboratorCategory,
        language: languages.length > 0 ? languages : undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        allergies: allergies.trim() || undefined,
        hasDrivingLicense: hasDrivingLicense || undefined,
        isVisitor: isVisitor || undefined,
        allowedTabs: allowedTabs.length > 0 ? allowedTabs : undefined,
      };
      
      // Si estamos editando y hay pestañas seleccionadas y email, enviar invitación automáticamente
      if (editingCollaborator && allowedTabs.length > 0 && email.trim() && projectId && onAddVisitor) {
        await handleInviteCollaborator();
      }
      
      // Si hay un proyecto seleccionado desde Contacts, añadirlo al proyecto
      if (selectedProjectId && onAddToProject) {
        onAddToProject(selectedProjectId, collaboratorData);
      }
      
      // Solo guardar en la base de datos global si NO estamos en la página de Contacts
      // (porque desde Contacts, el callback onAdd ya lo hace)
      if (projectId) {
        addGlobalContact(collaboratorData);
      }
      
      // Llamar al callback del padre
      onAdd(collaboratorData);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setLanguages([]);
    setIsLanguagesOpen(false);
    setAddress('');
    setWebsite('');
    setNotes('');
    setAllergies('');
    setHasDrivingLicense(false);
    setCategory('coproducers');
    setAllowedTabs([]);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
    setCustomLanguageInput('');
    setSelectedProjectId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingCollaborator ? 'Edit Contact' : 'Add Contact'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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

          {/* Selector de proyectos cuando se usa desde Contacts */}
          {!projectId && projects && projects.length > 0 && (
            <div className="form-group">
              <label htmlFor="project">Assign to Project (Optional)</label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">
              {category === 'locations' ? 'Location Name *' : 'Name/Company *'}
            </label>
            <div className="autocomplete-wrapper">
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                onFocus={() => {
                  if (name.trim() && nameSuggestions.length > 0) {
                    setShowNameSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestions
                  setTimeout(() => setShowNameSuggestions(false), 200);
                }}
                placeholder={category === 'locations' ? 'Location name' : 'Name or company name'}
                required
                autoFocus
              />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {nameSuggestions.map((contact) => (
                    <div
                      key={contact.id}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setName(contact.name);
                        fillContactFields(contact);
                        setShowNameSuggestions(false);
                      }}
                    >
                      <div className="suggestion-name">{contact.name}</div>
                      {contact.email && (
                        <div className="suggestion-email">{contact.email}</div>
                      )}
                      {contact.role && (
                        <div className="suggestion-role">{contact.role}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {category !== 'locations' && (
            <>
              <div className="form-group">
                <label htmlFor="role">Role/Position</label>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="E.g.: Producer, CEO, etc."
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Communication Languages</label>
            <div className="languages-dropdown-wrapper">
              <button
                type="button"
                className="languages-dropdown-trigger"
                onClick={() => setIsLanguagesOpen(!isLanguagesOpen)}
              >
                <span>
                  {languages.length > 0
                    ? languages.map((langCode) => {
                        const lang = languageOptions.find(l => l.code === langCode);
                        return lang ? `${lang.flag} ${lang.name}` : langCode;
                      }).join(', ')
                    : 'Select languages'}
                </span>
                <span className="dropdown-arrow">{isLanguagesOpen ? '▲' : '▼'}</span>
              </button>
              {isLanguagesOpen && (
                <div className="languages-dropdown-menu">
                  <div className="languages-row">
                    {languageOptions.map((lang) => (
                      <label key={lang.code} className="language-checkbox-item">
                        <input
                          type="checkbox"
                          checked={languages.includes(lang.code)}
                          onChange={() => handleToggleLanguage(lang.code)}
                        />
                        <span className="language-square">
                          <span className="language-flag">{lang.flag}</span>
                          <span className="language-code">{lang.code.toUpperCase()}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="custom-language-section" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={customLanguageInput}
                        onChange={(e) => setCustomLanguageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomLanguage();
                          }
                        }}
                        placeholder="Add custom language..."
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomLanguage}
                        disabled={!customLanguageInput.trim()}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', cursor: customLanguageInput.trim() ? 'pointer' : 'not-allowed' }}
                      >
                        Add
                      </button>
                    </div>
                    {languages.filter(l => !languageOptions.find(lo => lo.code === l)).length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Custom languages:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {languages.filter(l => !languageOptions.find(lo => lo.code === l)).map((customLang) => (
                            <span
                              key={customLang}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {customLang}
                              <button
                                type="button"
                                onClick={() => handleRemoveLanguage(customLang)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  padding: '0',
                                  marginLeft: '4px'
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Allowed Tabs</label>
            <div className="tabs-checkboxes-optimized">
              {allTabs.map((tab) => (
                <label key={tab.id} className="tab-checkbox-optimized">
                  <input
                    type="checkbox"
                    checked={allowedTabs.includes(tab.id)}
                    onChange={() => handleToggleTab(tab.id)}
                  />
                  <span>{tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <input
              id="allergies"
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="E.g.: Peanuts, Gluten, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="hasDrivingLicense" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                id="hasDrivingLicense"
                type="checkbox"
                checked={hasDrivingLicense}
                onChange={(e) => setHasDrivingLicense(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Has Driving License</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={18} />
              <span>{editingCollaborator ? 'Save Changes' : 'Add Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
