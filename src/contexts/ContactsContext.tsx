import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Collaborator } from '../types';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/storage';

interface ContactsContextType {
  globalContacts: Collaborator[];
  addGlobalContact: (contact: Omit<Collaborator, 'id'>) => void;
  updateGlobalContact: (email: string, updates: Partial<Collaborator>) => void;
  updateGlobalContactById: (contactId: string, updates: Partial<Collaborator>) => void;
  removeGlobalContact: (contactId: string) => void;
  findContactByName: (name: string) => Collaborator | undefined;
  searchContactsByName: (query: string) => Collaborator[];
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [globalContacts, setGlobalContacts] = useState<Collaborator[]>([]);

  // Recargar contactos cuando userId esté disponible (después del login)
  useEffect(() => {
    if (!userId) {
      setGlobalContacts([]);
      return;
    }

    const saved = localStorage.getItem(getUserStorageKey('globalContacts', userId));
    if (saved) {
      try {
        setGlobalContacts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading contacts:', e);
        setGlobalContacts([]);
      }
    } else {
      setGlobalContacts([]);
    }
  }, [userId]);

  // Guardar contactos cuando cambien
  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('globalContacts', userId), JSON.stringify(globalContacts));
    }
  }, [globalContacts, userId]);

  const addGlobalContact = (contact: Omit<Collaborator, 'id'>) => {
    // Buscar si ya existe por email o nombre
    const existingIndex = globalContacts.findIndex(
      c => 
        (c.email && contact.email && c.email.toLowerCase() === contact.email.toLowerCase()) ||
        c.name.toLowerCase() === contact.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Actualizar contacto existente
      setGlobalContacts(prev => 
        prev.map((c, i) => 
          i === existingIndex 
            ? { ...c, ...contact, id: c.id }
            : c
        )
      );
    } else {
      // Agregar nuevo contacto
      const newContact: Collaborator = {
        ...contact,
        id: Date.now().toString(),
      };
      setGlobalContacts(prev => [...prev, newContact]);
    }
  };

  const updateGlobalContact = (email: string, updates: Partial<Collaborator>) => {
    setGlobalContacts(prev =>
      prev.map(c =>
        c.email && c.email.toLowerCase() === email.toLowerCase()
          ? { ...c, ...updates }
          : c
      )
    );
  };

  const updateGlobalContactById = (contactId: string, updates: Partial<Collaborator>) => {
    setGlobalContacts(prev =>
      prev.map(c =>
        c.id === contactId
          ? { ...c, ...updates }
          : c
      )
    );
  };

  const removeGlobalContact = (contactId: string) => {
    setGlobalContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const findContactByName = (name: string): Collaborator | undefined => {
    return globalContacts.find(
      c => c.name.toLowerCase() === name.toLowerCase().trim()
    );
  };

  const searchContactsByName = (query: string): Collaborator[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    return globalContacts.filter(
      c => c.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limitar a 5 resultados
  };

  return (
    <ContactsContext.Provider
      value={{
        globalContacts,
        addGlobalContact,
        updateGlobalContact,
        updateGlobalContactById,
        removeGlobalContact,
        findContactByName,
        searchContactsByName,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}

