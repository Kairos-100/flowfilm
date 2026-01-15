import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Festival, FestivalRegion } from '../types';
import { festivalTemplates, createFestivalFromTemplate, generateFestivalsForYears } from '../data/festivalTemplates';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/storage';

interface FestivalsContextType {
  festivals: Festival[];
  addFestival: (festival: Festival) => void;
  updateFestival: (festivalId: string, updates: Partial<Festival>) => void;
  removeFestival: (festivalId: string) => void;
  getFestivalsByRegion: (region: FestivalRegion) => Festival[];
  getFestivalsByYear: (year: number) => Festival[];
  updateFestivalsForNewYear: () => void;
}

const FestivalsContext = createContext<FestivalsContextType | undefined>(undefined);

export function FestivalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [festivals, setFestivals] = useState<Festival[]>(() => {
    const currentYear = new Date().getFullYear();
    return generateFestivalsForYears(currentYear, currentYear + 1);
  });

  // Recargar festivales cuando userId esté disponible (después del login)
  useEffect(() => {
    if (!userId) {
      const currentYear = new Date().getFullYear();
      setFestivals(generateFestivalsForYears(currentYear, currentYear + 1));
      return;
    }
    
    const saved = localStorage.getItem(getUserStorageKey('festivals', userId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFestivals(parsed.map((f: any) => ({
          ...f,
          filmSubmissionDeadline: new Date(f.filmSubmissionDeadline),
          producersHubDeadline: new Date(f.producersHubDeadline),
          festivalStartDate: new Date(f.festivalStartDate),
          festivalEndDate: new Date(f.festivalEndDate),
        })));
      } catch (e) {
        console.error('Error loading festivals:', e);
        // Si hay error, generar festivales por defecto
        const currentYear = new Date().getFullYear();
        setFestivals(generateFestivalsForYears(currentYear, currentYear + 1));
      }
    } else {
      // Si no hay nada guardado, generar festivales para el año actual y el siguiente
      const currentYear = new Date().getFullYear();
      const defaultFestivals = generateFestivalsForYears(currentYear, currentYear + 1);
      setFestivals(defaultFestivals);
      localStorage.setItem(getUserStorageKey('festivals', userId), JSON.stringify(defaultFestivals));
    }
  }, [userId]);

  // Guardar en localStorage cuando cambien los festivales
  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('festivals', userId), JSON.stringify(festivals));
    }
  }, [festivals, userId]);

  // Función auxiliar para detectar si un festival está completamente vencido
  const isFestivalExpired = (festival: Festival): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Un festival está vencido si todas sus fechas importantes han pasado
    return (
      festival.festivalEndDate < today &&
      festival.filmSubmissionDeadline < today &&
      festival.producersHubDeadline < today
    );
  };

  // Función para obtener el ID base de la plantilla desde el ID del festival
  const getTemplateIdFromFestivalId = (festivalId: string): string | null => {
    // Los IDs tienen formato: "templateId-year" (ej: "cannes-2024")
    const parts = festivalId.split('-');
    if (parts.length >= 2) {
      // Tomar todo excepto el último elemento (que es el año)
      return parts.slice(0, -1).join('-');
    }
    return null;
  };

  const addFestival = (festival: Festival) => {
    setFestivals([...festivals, festival]);
  };

  const updateFestival = (festivalId: string, updates: Partial<Festival>) => {
    setFestivals(festivals.map(f => 
      f.id === festivalId ? { ...f, ...updates } : f
    ));
  };

  const removeFestival = (festivalId: string) => {
    setFestivals(festivals.filter(f => f.id !== festivalId));
  };

  const getFestivalsByRegion = (region: FestivalRegion): Festival[] => {
    return festivals.filter(f => f.region === region);
  };

  const getFestivalsByYear = (year: number): Festival[] => {
    return festivals.filter(f => f.year === year);
  };

  const updateFestivalsForNewYear = () => {
    setFestivals(currentFestivals => {
      const currentYear = new Date().getFullYear();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Identificar festivales vencidos que necesitan actualización
      const expiredFestivals = currentFestivals.filter(isFestivalExpired);
      
      // Crear nuevos festivales para el año siguiente basados en los vencidos
      const newFestivals: Festival[] = [];
      const festivalsToKeep: Festival[] = [];
      
      for (const expired of expiredFestivals) {
        const templateId = getTemplateIdFromFestivalId(expired.id);
        if (templateId) {
          const template = festivalTemplates.find(t => t.id === templateId);
          if (template) {
            // Crear festival para el año siguiente
            const nextYear = expired.year + 1;
            const newFestival = createFestivalFromTemplate(template, nextYear);
            
            // Verificar que no exista ya
            if (!currentFestivals.some(f => f.id === newFestival.id)) {
              newFestivals.push(newFestival);
            }
          }
        }
      }
      
      // Mantener festivales que no están vencidos o que son del año actual o siguientes
      for (const festival of currentFestivals) {
        if (!isFestivalExpired(festival) || festival.year >= currentYear) {
          festivalsToKeep.push(festival);
        }
      }
      
      // Combinar festivales a mantener con los nuevos
      const updatedFestivals = [...festivalsToKeep, ...newFestivals];
      
      // Asegurar que hay festivales para el año actual y siguiente
      const existingYears = new Set(updatedFestivals.map(f => f.year));
      
      if (!existingYears.has(currentYear)) {
        const currentYearFestivals = festivalTemplates.map(template => 
          createFestivalFromTemplate(template, currentYear)
        );
        updatedFestivals.push(...currentYearFestivals);
      }
      
      if (!existingYears.has(currentYear + 1)) {
        const nextYearFestivals = festivalTemplates.map(template => 
          createFestivalFromTemplate(template, currentYear + 1)
        );
        updatedFestivals.push(...nextYearFestivals);
      }
      
      return updatedFestivals;
    });
  };

  // Verificar y actualizar festivales al inicio del año
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const lastUpdateYear = localStorage.getItem('lastFestivalUpdateYear');
    
    if (!lastUpdateYear || parseInt(lastUpdateYear) < currentYear) {
      updateFestivalsForNewYear();
      localStorage.setItem('lastFestivalUpdateYear', currentYear.toString());
    }
  }, []);

  // Verificar y actualizar festivales vencidos periódicamente
  useEffect(() => {
    const checkAndUpdateExpiredFestivals = () => {
      // updateFestivalsForNewYear ya accede al estado actual usando la forma funcional de setFestivals
      // así que podemos llamarlo directamente sin depender del estado festivals
      updateFestivalsForNewYear();
    };
    
    // Verificar una vez al cargar (con un pequeño delay para asegurar que el estado esté listo)
    const initialCheck = setTimeout(checkAndUpdateExpiredFestivals, 1000);
    
    // Verificar periódicamente (cada día)
    const interval = setInterval(checkAndUpdateExpiredFestivals, 24 * 60 * 60 * 1000);
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, []); // Sin dependencias para evitar re-ejecuciones innecesarias

  return (
    <FestivalsContext.Provider
      value={{
        festivals,
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

