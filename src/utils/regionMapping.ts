import { FestivalRegion } from '../types';

// Mapeo de regiones de colaboradores a regiones de festivales
export const collaboratorRegionToFestivalRegion: Record<string, FestivalRegion> = {
  'Europa': 'europe',
  'Norte América': 'north-america',
  'Sur América': 'south-america',
  'Asia': 'asia',
  'África': 'africa',
  'Oceanía': 'oceania',
  'Medio Oriente': 'middle-east',
};

// Mapeo de países a regiones de festivales
export const countryToFestivalRegion: Record<string, FestivalRegion> = {
  // Asia
  'Corea del Sur': 'asia',
  'Corea': 'asia',
  'South Korea': 'asia',
  'Korea': 'asia',
  'Japón': 'asia',
  'Japan': 'asia',
  'China': 'asia',
  'India': 'asia',
  'Tailandia': 'asia',
  'Thailand': 'asia',
  'Singapur': 'asia',
  'Singapore': 'asia',
  'Filipinas': 'asia',
  'Philippines': 'asia',
  'Indonesia': 'asia',
  'Malasia': 'asia',
  'Malaysia': 'asia',
  'Vietnam': 'asia',
  'Taiwán': 'asia',
  'Taiwan': 'asia',
  'Hong Kong': 'asia',
  
  // Europa
  'España': 'europe',
  'Spain': 'europe',
  'Francia': 'europe',
  'France': 'europe',
  'Italia': 'europe',
  'Italy': 'europe',
  'Alemania': 'europe',
  'Germany': 'europe',
  'Reino Unido': 'europe',
  'United Kingdom': 'europe',
  'UK': 'europe',
  'Portugal': 'europe',
  'Polonia': 'europe',
  'Poland': 'europe',
  'Grecia': 'europe',
  'Greece': 'europe',
  'Países Bajos': 'europe',
  'Netherlands': 'europe',
  'Bélgica': 'europe',
  'Belgium': 'europe',
  'Suiza': 'europe',
  'Switzerland': 'europe',
  'Austria': 'europe',
  'Suecia': 'europe',
  'Sweden': 'europe',
  'Noruega': 'europe',
  'Norway': 'europe',
  'Dinamarca': 'europe',
  'Denmark': 'europe',
  'Finlandia': 'europe',
  'Finland': 'europe',
  
  // Norte América
  'Estados Unidos': 'north-america',
  'United States': 'north-america',
  'USA': 'north-america',
  'US': 'north-america',
  'Canadá': 'north-america',
  'Canada': 'north-america',
  'México': 'north-america',
  'Mexico': 'north-america',
  
  // Sur América
  'Argentina': 'south-america',
  'Brasil': 'south-america',
  'Brazil': 'south-america',
  'Chile': 'south-america',
  'Colombia': 'south-america',
  'Perú': 'south-america',
  'Peru': 'south-america',
  'Uruguay': 'south-america',
  'Venezuela': 'south-america',
  'Ecuador': 'south-america',
  'Paraguay': 'south-america',
  'Bolivia': 'south-america',
  
  // África
  'Sudáfrica': 'africa',
  'South Africa': 'africa',
  'Egipto': 'africa',
  'Egypt': 'africa',
  'Marruecos': 'africa',
  'Morocco': 'africa',
  'Nigeria': 'africa',
  'Kenia': 'africa',
  'Kenya': 'africa',
  
  // Oceanía
  'Australia': 'oceania',
  'Nueva Zelanda': 'oceania',
  'New Zealand': 'oceania',
  
  // Medio Oriente
  'Israel': 'middle-east',
  'Turquía': 'middle-east',
  'Turkey': 'middle-east',
  'Emiratos Árabes Unidos': 'middle-east',
  'United Arab Emirates': 'middle-east',
  'UAE': 'middle-east',
  'Arabia Saudí': 'middle-east',
  'Saudi Arabia': 'middle-east',
  'Irán': 'middle-east',
  'Iran': 'middle-east',
  'Líbano': 'middle-east',
  'Lebanon': 'middle-east',
};

/**
 * Obtiene la región de festivales a partir de una región de colaborador
 */
export function getFestivalRegionFromCollaboratorRegion(collaboratorRegion: string): FestivalRegion | null {
  return collaboratorRegionToFestivalRegion[collaboratorRegion] || null;
}

/**
 * Obtiene la región de festivales a partir de un país
 */
export function getFestivalRegionFromCountry(country: string): FestivalRegion | null {
  return countryToFestivalRegion[country] || null;
}

/**
 * Obtiene la región de festivales a partir de un país o región de colaborador
 */
export function getFestivalRegion(countryOrRegion?: string): FestivalRegion | null {
  if (!countryOrRegion) return null;
  
  // Primero intentar como país
  const fromCountry = getFestivalRegionFromCountry(countryOrRegion);
  if (fromCountry) return fromCountry;
  
  // Luego intentar como región de colaborador
  const fromRegion = getFestivalRegionFromCollaboratorRegion(countryOrRegion);
  if (fromRegion) return fromRegion;
  
  return null;
}







