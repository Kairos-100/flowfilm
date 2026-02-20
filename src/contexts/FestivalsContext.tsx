import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Festival, FestivalRegion } from '../types';
import { festivalTemplates, createFestivalFromTemplate, generateFestivalsForYears } from '../data/festivalTemplates';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getUserStorageKey } from '../utils/storage';

interface FestivalsContextType {
  festivals: Festival[];
  loading: boolean;
  addFestival: (festival: Festival) => Promise<void>;
  updateFestival: (festivalId: string, updates: Partial<Festival>) => Promise<void>;
  removeFestival: (festivalId: string) => Promise<void>;
  getFestivalsByRegion: (region: FestivalRegion) => Festival[];
  getFestivalsByYear: (year: number) => Festival[];
  updateFestivalsForNewYear: () => Promise<void>;
}

const FestivalsContext = createContext<FestivalsContextType | undefined>(undefined);

export function FestivalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  // Migrar datos de localStorage a Supabase (solo una vez)
  const migrateFromLocalStorage = useCallback(async (userId: string) => {
    try {
      // Verificar si ya hay datos en Supabase
      const { data: existingFestivals } = await supabase
        .from('festivals')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // Si ya hay datos en Supabase, no migrar
      if (existingFestivals && existingFestivals.length > 0) {
        return;
      }

      // Migrar festivales
      const saved = localStorage.getItem(getUserStorageKey('festivals', userId));
      if (saved) {
        const parsed = JSON.parse(saved);
        const festivalsToInsert = parsed.map((f: Festival) => ({
          id: f.id,
          user_id: userId,
          name: f.name,
          region: f.region,
          year: f.year,
          film_submission_deadline: f.filmSubmissionDeadline.toISOString().split('T')[0],
          producers_hub_deadline: f.producersHubDeadline.toISOString().split('T')[0],
          festival_start_date: f.festivalStartDate.toISOString().split('T')[0],
          festival_end_date: f.festivalEndDate.toISOString().split('T')[0],
          number_of_days: f.numberOfDays,
          contacts: f.contacts || [],
          website: f.website || null,
          location: f.location || null,
        }));

        if (festivalsToInsert.length > 0) {
          await supabase.from('festivals').insert(festivalsToInsert);
        }
      } else {
        // Si no hay nada guardado, generar festivales para el año actual y el siguiente
        const currentYear = new Date().getFullYear();
        const defaultFestivals = generateFestivalsForYears(currentYear, currentYear + 1);
        const festivalsToInsert = defaultFestivals.map((f: Festival) => ({
          id: f.id,
          user_id: userId,
          name: f.name,
          region: f.region,
          year: f.year,
          film_submission_deadline: f.filmSubmissionDeadline.toISOString().split('T')[0],
          producers_hub_deadline: f.producersHubDeadline.toISOString().split('T')[0],
          festival_start_date: f.festivalStartDate.toISOString().split('T')[0],
          festival_end_date: f.festivalEndDate.toISOString().split('T')[0],
          number_of_days: f.numberOfDays,
          contacts: f.contacts || [],
          website: f.website || null,
          location: f.location || null,
        }));

        if (festivalsToInsert.length > 0) {
          await supabase.from('festivals').insert(festivalsToInsert);
        }
      }
    } catch (error) {
      console.error('Error migrating festivals from localStorage:', error);
    }
  }, []);

  // Cargar festivales desde Supabase
  const loadFestivals = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // Migrar datos de localStorage si es necesario
      await migrateFromLocalStorage(userId);

      // Cargar festivales
      const { data: festivalsData, error } = await supabase
        .from('festivals')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: true })
        .order('festival_start_date', { ascending: true });

      if (error) throw error;

      if (festivalsData && festivalsData.length > 0) {
        const loadedFestivals = festivalsData.map((f: any) => ({
          id: f.id,
          name: f.name,
          region: f.region,
          year: f.year,
          filmSubmissionDeadline: new Date(f.film_submission_deadline),
          producersHubDeadline: new Date(f.producers_hub_deadline),
          festivalStartDate: new Date(f.festival_start_date),
          festivalEndDate: new Date(f.festival_end_date),
          numberOfDays: f.number_of_days,
          contacts: f.contacts || [],
          website: f.website,
          location: f.location,
        }));

        setFestivals(loadedFestivals);
      } else {
        // Si no hay datos, generar festivales por defecto
        const currentYear = new Date().getFullYear();
        const defaultFestivals = generateFestivalsForYears(currentYear, currentYear + 1);
        setFestivals(defaultFestivals);
      }
    } catch (error) {
      console.error('Error loading festivals from Supabase:', error);
      // Si hay error, generar festivales por defecto
      const currentYear = new Date().getFullYear();
      setFestivals(generateFestivalsForYears(currentYear, currentYear + 1));
    } finally {
      setLoading(false);
    }
  }, [migrateFromLocalStorage]);

  // Cargar festivales cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadFestivals(userId);
    } else {
      const currentYear = new Date().getFullYear();
      setFestivals(generateFestivalsForYears(currentYear, currentYear + 1));
      setLoading(false);
    }
  }, [userId, loadFestivals]);

  // Función auxiliar para detectar si un festival está completamente vencido
  const isFestivalExpired = (festival: Festival): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      festival.festivalEndDate < today &&
      festival.filmSubmissionDeadline < today &&
      festival.producersHubDeadline < today
    );
  };

  // Función para obtener el ID base de la plantilla desde el ID del festival
  const getTemplateIdFromFestivalId = (festivalId: string): string | null => {
    const parts = festivalId.split('-');
    if (parts.length >= 2) {
      return parts.slice(0, -1).join('-');
    }
    return null;
  };

  const addFestival = async (festival: Festival) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('festivals').insert({
        id: festival.id,
        user_id: userId,
        name: festival.name,
        region: festival.region,
        year: festival.year,
        film_submission_deadline: festival.filmSubmissionDeadline.toISOString().split('T')[0],
        producers_hub_deadline: festival.producersHubDeadline.toISOString().split('T')[0],
        festival_start_date: festival.festivalStartDate.toISOString().split('T')[0],
        festival_end_date: festival.festivalEndDate.toISOString().split('T')[0],
        number_of_days: festival.numberOfDays,
        contacts: festival.contacts || [],
        website: festival.website || null,
        location: festival.location || null,
      });

      if (error) throw error;

      setFestivals([...festivals, festival]);
    } catch (error) {
      console.error('Error adding festival:', error);
      throw error;
    }
  };

  const updateFestival = async (festivalId: string, updates: Partial<Festival>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.region !== undefined) updateData.region = updates.region;
      if (updates.year !== undefined) updateData.year = updates.year;
      if (updates.filmSubmissionDeadline !== undefined) updateData.film_submission_deadline = updates.filmSubmissionDeadline.toISOString().split('T')[0];
      if (updates.producersHubDeadline !== undefined) updateData.producers_hub_deadline = updates.producersHubDeadline.toISOString().split('T')[0];
      if (updates.festivalStartDate !== undefined) updateData.festival_start_date = updates.festivalStartDate.toISOString().split('T')[0];
      if (updates.festivalEndDate !== undefined) updateData.festival_end_date = updates.festivalEndDate.toISOString().split('T')[0];
      if (updates.numberOfDays !== undefined) updateData.number_of_days = updates.numberOfDays;
      if (updates.contacts !== undefined) updateData.contacts = updates.contacts;
      if (updates.website !== undefined) updateData.website = updates.website || null;
      if (updates.location !== undefined) updateData.location = updates.location || null;

      const { error } = await supabase
        .from('festivals')
        .update(updateData)
        .eq('id', festivalId)
        .eq('user_id', userId);

      if (error) throw error;

      setFestivals(festivals.map(f => 
        f.id === festivalId ? { ...f, ...updates } : f
      ));
    } catch (error) {
      console.error('Error updating festival:', error);
      throw error;
    }
  };

  const removeFestival = async (festivalId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('festivals')
        .delete()
        .eq('id', festivalId)
        .eq('user_id', userId);

      if (error) throw error;

      setFestivals(festivals.filter(f => f.id !== festivalId));
    } catch (error) {
      console.error('Error removing festival:', error);
      throw error;
    }
  };

  const getFestivalsByRegion = (region: FestivalRegion): Festival[] => {
    return festivals.filter(f => f.region === region);
  };

  const getFestivalsByYear = (year: number): Festival[] => {
    return festivals.filter(f => f.year === year);
  };

  const updateFestivalsForNewYear = useCallback(async () => {
    if (!userId) return;

    setFestivals(currentFestivals => {
      const currentYear = new Date().getFullYear();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredFestivals = currentFestivals.filter(isFestivalExpired);
      const newFestivals: Festival[] = [];
      const festivalsToKeep: Festival[] = [];
      
      for (const expired of expiredFestivals) {
        const templateId = getTemplateIdFromFestivalId(expired.id);
        if (templateId) {
          const template = festivalTemplates.find(t => t.id === templateId);
          if (template) {
            const nextYear = expired.year + 1;
            const newFestival = createFestivalFromTemplate(template, nextYear);
            
            if (!currentFestivals.some(f => f.id === newFestival.id)) {
              newFestivals.push(newFestival);
              // Guardar en Supabase
              supabase.from('festivals').insert({
                id: newFestival.id,
                user_id: userId,
                name: newFestival.name,
                region: newFestival.region,
                year: newFestival.year,
                film_submission_deadline: newFestival.filmSubmissionDeadline.toISOString().split('T')[0],
                producers_hub_deadline: newFestival.producersHubDeadline.toISOString().split('T')[0],
                festival_start_date: newFestival.festivalStartDate.toISOString().split('T')[0],
                festival_end_date: newFestival.festivalEndDate.toISOString().split('T')[0],
                number_of_days: newFestival.numberOfDays,
                contacts: newFestival.contacts || [],
                website: newFestival.website || null,
                location: newFestival.location || null,
              }).catch(err => console.error('Error adding new festival:', err));
            }
          }
        }
      }
      
      for (const festival of currentFestivals) {
        if (!isFestivalExpired(festival) || festival.year >= currentYear) {
          festivalsToKeep.push(festival);
        } else {
          // Eliminar festival vencido de Supabase
          supabase.from('festivals')
            .delete()
            .eq('id', festival.id)
            .eq('user_id', userId)
            .catch(err => console.error('Error removing expired festival:', err));
        }
      }
      
      const updatedFestivals = [...festivalsToKeep, ...newFestivals];
      
      const existingYears = new Set(updatedFestivals.map(f => f.year));
      
      if (!existingYears.has(currentYear)) {
        const currentYearFestivals = festivalTemplates.map(template => 
          createFestivalFromTemplate(template, currentYear)
        );
        updatedFestivals.push(...currentYearFestivals);
        // Guardar en Supabase
        currentYearFestivals.forEach(f => {
          supabase.from('festivals').insert({
            id: f.id,
            user_id: userId,
            name: f.name,
            region: f.region,
            year: f.year,
            film_submission_deadline: f.filmSubmissionDeadline.toISOString().split('T')[0],
            producers_hub_deadline: f.producersHubDeadline.toISOString().split('T')[0],
            festival_start_date: f.festivalStartDate.toISOString().split('T')[0],
            festival_end_date: f.festivalEndDate.toISOString().split('T')[0],
            number_of_days: f.numberOfDays,
            contacts: f.contacts || [],
            website: f.website || null,
            location: f.location || null,
          }).catch(err => console.error('Error adding current year festival:', err));
        });
      }
      
      if (!existingYears.has(currentYear + 1)) {
        const nextYearFestivals = festivalTemplates.map(template => 
          createFestivalFromTemplate(template, currentYear + 1)
        );
        updatedFestivals.push(...nextYearFestivals);
        // Guardar en Supabase
        nextYearFestivals.forEach(f => {
          supabase.from('festivals').insert({
            id: f.id,
            user_id: userId,
            name: f.name,
            region: f.region,
            year: f.year,
            film_submission_deadline: f.filmSubmissionDeadline.toISOString().split('T')[0],
            producers_hub_deadline: f.producersHubDeadline.toISOString().split('T')[0],
            festival_start_date: f.festivalStartDate.toISOString().split('T')[0],
            festival_end_date: f.festivalEndDate.toISOString().split('T')[0],
            number_of_days: f.numberOfDays,
            contacts: f.contacts || [],
            website: f.website || null,
            location: f.location || null,
          }).catch(err => console.error('Error adding next year festival:', err));
        });
      }
      
      return updatedFestivals;
    });
  }, [userId]);

  // Verificar y actualizar festivales al inicio del año
  useEffect(() => {
    if (!userId) return;

    const currentYear = new Date().getFullYear();
    const lastUpdateYear = localStorage.getItem('lastFestivalUpdateYear');
    
    if (!lastUpdateYear || parseInt(lastUpdateYear) < currentYear) {
      updateFestivalsForNewYear();
      localStorage.setItem('lastFestivalUpdateYear', currentYear.toString());
    }
  }, [userId, updateFestivalsForNewYear]);

  // Verificar y actualizar festivales vencidos periódicamente
  useEffect(() => {
    if (!userId) return;

    const checkAndUpdateExpiredFestivals = () => {
      updateFestivalsForNewYear();
    };
    
    const initialCheck = setTimeout(checkAndUpdateExpiredFestivals, 1000);
    const interval = setInterval(checkAndUpdateExpiredFestivals, 24 * 60 * 60 * 1000);
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [userId, updateFestivalsForNewYear]);

  return (
    <FestivalsContext.Provider
      value={{
        festivals,
        loading,
        addFestival,
        updateFestival,
        removeFestival,
        getFestivalsByRegion,
        getFestivalsByYear,
        updateFestivalsForNewYear,
      }}
    >
      {children}
    </FestivalsContext.Provider>
  );
}

export function useFestivals() {
  const context = useContext(FestivalsContext);
  if (context === undefined) {
    throw new Error('useFestivals must be used within a FestivalsProvider');
  }
  return context;
}
