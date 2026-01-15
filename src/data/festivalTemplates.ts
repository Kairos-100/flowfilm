import { Festival, FestivalRegion } from '../types';

/**
 * Plantilla base de un festival con información que no cambia año a año
 */
export interface FestivalTemplate {
  id: string;
  name: string;
  region: FestivalRegion;
  location: string;
  website?: string;
  contacts: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  }[];
  // Patrones de fechas (mes y día, sin año)
  datePatterns: {
    filmSubmissionDeadline: { month: number; day: number }; // 0-11 para mes, 1-31 para día
    producersHubDeadline: { month: number; day: number };
    festivalStartDate: { month: number; day: number };
    festivalEndDate: { month: number; day: number };
  };
  numberOfDays: number;
}

/**
 * Plantillas base de festivales
 * Estas contienen la información que no cambia año a año
 */
export const festivalTemplates: FestivalTemplate[] = [
  {
    id: 'cannes',
    name: 'Cannes Film Festival',
    region: 'europe',
    location: 'Cannes, France',
    website: 'https://www.festival-cannes.com',
    contacts: [
      {
        name: 'Thierry Frémaux',
        role: 'Artistic Director',
        email: 'thierry.fremaux@festival-cannes.fr',
        phone: '+33 4 93 99 71 71',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 2, day: 15 }, // 15 de marzo
      producersHubDeadline: { month: 3, day: 1 }, // 1 de abril
      festivalStartDate: { month: 4, day: 14 }, // 14 de mayo
      festivalEndDate: { month: 4, day: 25 }, // 25 de mayo
    },
    numberOfDays: 12,
  },
  {
    id: 'sundance',
    name: 'Sundance Film Festival',
    region: 'north-america',
    location: 'Park City, Utah, USA',
    website: 'https://www.sundance.org',
    contacts: [
      {
        name: 'Kim Yutani',
        role: 'Director of Programming',
        email: 'programming@sundance.org',
        phone: '+1 435 658 3456',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 7, day: 15 }, // 15 de agosto
      producersHubDeadline: { month: 8, day: 1 }, // 1 de septiembre
      festivalStartDate: { month: 0, day: 23 }, // 23 de enero
      festivalEndDate: { month: 1, day: 2 }, // 2 de febrero
    },
    numberOfDays: 11,
  },
  {
    id: 'berlin',
    name: 'Berlin International Film Festival',
    region: 'europe',
    location: 'Berlin, Germany',
    website: 'https://www.berlinale.de',
    contacts: [
      {
        name: 'Carlo Chatrian',
        role: 'Artistic Director',
        email: 'info@berlinale.de',
        phone: '+49 30 259 20 0',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 9, day: 15 }, // 15 de octubre
      producersHubDeadline: { month: 10, day: 1 }, // 1 de noviembre
      festivalStartDate: { month: 1, day: 13 }, // 13 de febrero
      festivalEndDate: { month: 1, day: 23 }, // 23 de febrero
    },
    numberOfDays: 11,
  },
  {
    id: 'toronto',
    name: 'Toronto International Film Festival',
    region: 'north-america',
    location: 'Toronto, Canada',
    website: 'https://www.tiff.net',
    contacts: [
      {
        name: 'Cameron Bailey',
        role: 'CEO & Artistic Director',
        email: 'info@tiff.net',
        phone: '+1 416 599 8433',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 4, day: 15 }, // 15 de mayo
      producersHubDeadline: { month: 5, day: 1 }, // 1 de junio
      festivalStartDate: { month: 8, day: 4 }, // 4 de septiembre
      festivalEndDate: { month: 8, day: 14 }, // 14 de septiembre
    },
    numberOfDays: 11,
  },
  {
    id: 'venice',
    name: 'Venice Film Festival',
    region: 'europe',
    location: 'Venice, Italy',
    website: 'https://www.labiennale.org',
    contacts: [
      {
        name: 'Alberto Barbera',
        role: 'Artistic Director',
        email: 'info@labiennale.org',
        phone: '+39 041 272 6500',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 5, day: 15 }, // 15 de junio
      producersHubDeadline: { month: 6, day: 1 }, // 1 de julio
      festivalStartDate: { month: 7, day: 27 }, // 27 de agosto
      festivalEndDate: { month: 8, day: 6 }, // 6 de septiembre
    },
    numberOfDays: 11,
  },
  {
    id: 'busan',
    name: 'Busan International Film Festival',
    region: 'asia',
    location: 'Busan, South Korea',
    website: 'https://www.biff.kr',
    contacts: [
      {
        name: 'Jay Jeon',
        role: 'Programmer',
        email: 'program@biff.kr',
        phone: '+82 51 709 2200',
      },
    ],
    datePatterns: {
      filmSubmissionDeadline: { month: 5, day: 30 }, // 30 de junio
      producersHubDeadline: { month: 6, day: 15 }, // 15 de julio
      festivalStartDate: { month: 9, day: 1 }, // 1 de octubre
      festivalEndDate: { month: 9, day: 10 }, // 10 de octubre
    },
    numberOfDays: 10,
  },
];

/**
 * Crea una instancia de Festival para un año específico a partir de una plantilla
 */
export function createFestivalFromTemplate(template: FestivalTemplate, year: number): Festival {
  const createDate = (pattern: { month: number; day: number }) => {
    return new Date(year, pattern.month, pattern.day);
  };

  return {
    id: `${template.id}-${year}`,
    name: template.name,
    region: template.region,
    year,
    filmSubmissionDeadline: createDate(template.datePatterns.filmSubmissionDeadline),
    producersHubDeadline: createDate(template.datePatterns.producersHubDeadline),
    festivalStartDate: createDate(template.datePatterns.festivalStartDate),
    festivalEndDate: createDate(template.datePatterns.festivalEndDate),
    numberOfDays: template.numberOfDays,
    location: template.location,
    website: template.website,
    contacts: template.contacts,
  };
}

/**
 * Genera festivales para un rango de años
 */
export function generateFestivalsForYears(startYear: number, endYear: number): Festival[] {
  const festivals: Festival[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    for (const template of festivalTemplates) {
      festivals.push(createFestivalFromTemplate(template, year));
    }
  }
  
  return festivals;
}







