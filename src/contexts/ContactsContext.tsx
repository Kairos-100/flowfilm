import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Collaborator } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getUserStorageKey } from '../utils/storage';

interface ContactsContextType {
  globalContacts: Collaborator[];
  loading: boolean;
  addGlobalContact: (contact: Omit<Collaborator, 'id'>) => Promise<void>;
  updateGlobalContact: (email: string, updates: Partial<Collaborator>) => Promise<void>;
  updateGlobalContactById: (contactId: string, updates: Partial<Collaborator>) => Promise<void>;
  removeGlobalContact: (contactId: string) => Promise<void>;
  findContactByName: (name: string) => Collaborator | undefined;
  searchContactsByName: (query: string) => Collaborator[];
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [globalContacts, setGlobalContacts] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // Migrar datos de localStorage a Supabase (solo una vez)
  const migrateFromLocalStorage = useCallback(async (userId: string) => {
    try {
      // Verificar si ya hay datos en Supabase
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // Si ya hay datos en Supabase, no migrar
      if (existingContacts && existingContacts.length > 0) {
        return;
      }

      // Migrar contactos
      const saved = localStorage.getItem(getUserStorageKey('globalContacts', userId));
      if (saved) {
        const parsed = JSON.parse(saved);
        const contactsToInsert = parsed.map((c: Collaborator) => ({
          id: c.id,
          user_id: userId,
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
          is_visitor: c.isVisitor || false,
          allowed_tabs: c.allowedTabs || [],
        }));

        if (contactsToInsert.length > 0) {
          await supabase.from('contacts').insert(contactsToInsert);
        }
      }
    } catch (error) {
      console.error('Error migrating contacts from localStorage:', error);
    }
  }, []);

  // Cargar contactos desde Supabase
  const loadContacts = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // Migrar datos de localStorage si es necesario
      await migrateFromLocalStorage(userId);

      // Cargar contactos
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      const loadedContacts = (contactsData || []).map((c: any) => ({
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
        isVisitor: c.is_visitor,
        allowedTabs: c.allowed_tabs || [],
      }));

      setGlobalContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, [migrateFromLocalStorage]);

  // Cargar contactos cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadContacts(userId);
    } else {
      setGlobalContacts([]);
      setLoading(false);
    }
  }, [userId, loadContacts]);

  const addGlobalContact = async (contact: Omit<Collaborator, 'id'>) => {
    if (!userId) return;

    try {
      // Buscar si ya existe por email o nombre
      const existing = globalContacts.find(
        c => 
          (c.email && contact.email && c.email.toLowerCase() === contact.email.toLowerCase()) ||
          c.name.toLowerCase() === contact.name.toLowerCase()
      );

      if (existing) {
        // Actualizar contacto existente
        await updateGlobalContactById(existing.id, contact);
        return;
      }

      // Agregar nuevo contacto
      const newId = Date.now().toString();
      const { error } = await supabase.from('contacts').insert({
        id: newId,
        user_id: userId,
        name: contact.name,
        role: contact.role || null,
        email: contact.email || null,
        phone: contact.phone || null,
        category: contact.category || 'studios',
        language: contact.language || [],
        address: contact.address || null,
        website: contact.website || null,
        notes: contact.notes || null,
        allergies: contact.allergies || null,
        has_driving_license: contact.hasDrivingLicense || false,
        is_visitor: contact.isVisitor || false,
        allowed_tabs: contact.allowedTabs || [],
      });

      if (error) throw error;

      const newContact: Collaborator = {
        ...contact,
        id: newId,
      };
      setGlobalContacts(prev => [...prev, newContact]);
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  };

  const updateGlobalContact = async (email: string, updates: Partial<Collaborator>) => {
    if (!userId) return;

    try {
      const contact = globalContacts.find(
        c => c.email && c.email.toLowerCase() === email.toLowerCase()
      );

      if (!contact) return;

      await updateGlobalContactById(contact.id, updates);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const updateGlobalContactById = async (contactId: string, updates: Partial<Collaborator>) => {
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
      if (updates.isVisitor !== undefined) updateData.is_visitor = updates.isVisitor;
      if (updates.allowedTabs !== undefined) updateData.allowed_tabs = updates.allowedTabs || [];

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('user_id', userId);

      if (error) throw error;

      setGlobalContacts(prev =>
        prev.map(c =>
          c.id === contactId
            ? { ...c, ...updates }
            : c
        )
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const removeGlobalContact = async (contactId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', userId);

      if (error) throw error;

      setGlobalContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error removing contact:', error);
      throw error;
    }
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
        loading,
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
