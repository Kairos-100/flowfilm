import { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { Collaborator, CollaboratorCategory, TabType } from '../../types';
import SimpleCustomSelect from '../SimpleCustomSelect';
import { useContacts } from '../../contexts/ContactsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserStorageKey } from '../../utils/storage';
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

export default function AddCollaboratorModal({ isOpen, onClose, onAdd, editingCollaborator }: AddCollaboratorModalProps) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const { findContactByName, searchContactsByName, addGlobalContact } = useContacts();
  const [category, setCategory] = useState<string>('coproducers');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [allowedTabs, setAllowedTabs] = useState<TabType[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<Collaborator[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

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
        // Autocompletar todos los campos automáticamente
        setEmail(exactMatch.email || '');
        setRole(exactMatch.role || '');
        setPhone(exactMatch.phone || '');
        setAddress(exactMatch.address || '');
        setWebsite(exactMatch.website || '');
        setNotes(exactMatch.notes || '');
        if (exactMatch.language) {
          setLanguages(Array.isArray(exactMatch.language) 
            ? exactMatch.language 
            : (typeof exactMatch.language === 'string' ? [exactMatch.language] : []));
        } else {
          setLanguages([]);
        }
        if (exactMatch.allowedTabs) {
          setAllowedTabs(exactMatch.allowedTabs);
        } else {
          setAllowedTabs([]);
        }
        setCategory(exactMatch.category);
        setShowNameSuggestions(false);
      } else {
        // Si no hay coincidencia exacta, buscar sugerencias
        const suggestions = searchContactsByName(newName);
        setNameSuggestions(suggestions);
        setShowNameSuggestions(suggestions.length > 0);
        
        // Si solo hay una sugerencia y el nombre coincide completamente, autocompletar
        if (suggestions.length === 1 && suggestions[0].name.toLowerCase() === newName.toLowerCase().trim()) {
          const contact = suggestions[0];
          setEmail(contact.email || '');
          setRole(contact.role || '');
          setPhone(contact.phone || '');
          setAddress(contact.address || '');
          setWebsite(contact.website || '');
          setNotes(contact.notes || '');
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

  const handleToggleTab = (tabId: TabType) => {
    if (allowedTabs.includes(tabId)) {
      setAllowedTabs(allowedTabs.filter((id) => id !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
        isVisitor: isVisitor || undefined,
        allowedTabs: allowedTabs.length > 0 ? allowedTabs : undefined,
      };
      
      // Guardar en la base de datos global
      addGlobalContact(collaboratorData);
      
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
    setCategory('coproducers');
    setAllowedTabs([]);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
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
                        e.preventDefault(); // Prevenir blur del input
                        setName(contact.name);
                        setEmail(contact.email || '');
                        setRole(contact.role || '');
                        setPhone(contact.phone || '');
                        setAddress(contact.address || '');
                        setWebsite(contact.website || '');
                        setNotes(contact.notes || '');
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
                        return lang ? `${lang.flag} ${lang.name}` : '';
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
