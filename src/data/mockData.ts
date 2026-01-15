import { Project, Collaborator, BudgetItem, Script, Document, Director, CalendarEvent, Visitor, Festival, Task } from '../types';

export const mockProjects: Project[] = [
  // ORIGINALS - Feature Film
  { id: '1', title: 'I AM NOW IN HEAVEN', status: 'produccion', category: 'originals', subcategory: 'feature-film', createdAt: new Date('2023-01-15'), updatedAt: new Date('2024-12-01') },
  { id: '2', title: 'SHIMMERING SEA', status: 'produccion', category: 'originals', subcategory: 'feature-film', createdAt: new Date('2023-02-20'), updatedAt: new Date('2024-11-28') },
  { id: '3', title: 'DARKNESS AT NOON', status: 'produccion', category: 'originals', subcategory: 'feature-film', createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-12-05') },
  { id: '4', title: 'THE DRONES 드론', status: 'produccion', category: 'originals', subcategory: 'feature-film', createdAt: new Date('2023-04-15'), updatedAt: new Date('2024-12-01') },
  { id: '5', title: 'A SMALL LUCK', status: 'produccion', category: 'originals', subcategory: 'feature-film', createdAt: new Date('2023-05-20'), updatedAt: new Date('2024-11-28') },
  // ORIGINALS - Documentary
  { id: '6', title: 'VOICES ON THE STREETS', status: 'produccion', category: 'originals', subcategory: 'documentary', createdAt: new Date('2023-06-10'), updatedAt: new Date('2024-12-05') },
  // ORIGINALS - Audiovisual
  { id: '7', title: 'NINE SONGS 九歌', status: 'produccion', category: 'originals', subcategory: 'audiovisual', createdAt: new Date('2023-07-15'), updatedAt: new Date('2024-12-01') },
  // TV SERIES
  { id: '8', title: 'LOST IDOLS', status: 'produccion', category: 'originals', subcategory: 'tv-series', createdAt: new Date('2023-08-20'), updatedAt: new Date('2024-11-28') },
  { id: '9', title: 'BENJIRO 벤지로', status: 'produccion', category: 'originals', subcategory: 'tv-series', createdAt: new Date('2023-09-10'), updatedAt: new Date('2024-12-05') },
  { id: '10', title: 'THE SILENT ROSE 침묵속 장미', status: 'produccion', category: 'originals', subcategory: 'tv-series', createdAt: new Date('2023-10-15'), updatedAt: new Date('2024-12-01') },
  { id: '11', title: 'NEW DARK AGE 새로운 암흑기', status: 'produccion', category: 'originals', subcategory: 'tv-series', createdAt: new Date('2023-11-20'), updatedAt: new Date('2024-11-28') },
  // SHORT FILMS
  { id: '12', title: 'IN THE NAME OF GOD', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2023-12-10'), updatedAt: new Date('2024-12-05') },
  { id: '13', title: 'EARTHLINGS AND ANGELS', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-12-01') },
  { id: '14', title: 'BRIGHTER DAYS', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2024-02-20'), updatedAt: new Date('2024-11-28') },
  { id: '15', title: 'RAINBOW OF EMBERS', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2024-03-10'), updatedAt: new Date('2024-12-05') },
  { id: '16', title: 'NAM', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2024-04-15'), updatedAt: new Date('2024-12-01') },
  { id: '17', title: 'STILL INTACT', status: 'produccion', category: 'originals', subcategory: 'short-film', createdAt: new Date('2024-05-20'), updatedAt: new Date('2024-11-28') },
  // CO-PRODUCTIONS - Feature Film
  { id: '18', title: 'KOKDU', status: 'produccion', category: 'co-productions', subcategory: 'feature-film', createdAt: new Date('2023-06-10'), updatedAt: new Date('2024-12-05') },
  // CO-PRODUCTIONS - Documentary
  { id: '19', title: 'KORYO SARAM', status: 'produccion', category: 'co-productions', subcategory: 'documentary', createdAt: new Date('2023-07-15'), updatedAt: new Date('2024-12-01') },
  // COMMISSIONS - Commercial
  { id: '20', title: 'IIHF 2025', status: 'produccion', category: 'commissions', subcategory: 'commercial', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-12-01') },
  { id: '21', title: 'MORPHIC FIELD', status: 'produccion', category: 'commissions', subcategory: 'commercial', createdAt: new Date('2024-02-20'), updatedAt: new Date('2024-11-28') },
  { id: '22', title: 'HILDING ANDERS', status: 'produccion', category: 'commissions', subcategory: 'commercial', createdAt: new Date('2024-03-10'), updatedAt: new Date('2024-12-05') },
  { id: '23', title: 'TESORI', status: 'produccion', category: 'commissions', subcategory: 'commercial', createdAt: new Date('2024-04-15'), updatedAt: new Date('2024-12-01') },
];

export const mockCollaborators: Record<string, Collaborator[]> = {
  '1': [
    { id: '1', name: 'María García', role: 'Productora Ejecutiva', email: 'maria@seagullfilms.com', phone: '+34 600 123 456', category: 'coproducers' },
    { id: '2', name: 'Juan Pérez', role: 'Director de Fotografía', email: 'juan@seagullfilms.com', phone: '+34 600 234 567', category: 'studios' },
    { id: '3', name: 'Ana López', role: 'Script Supervisor', email: 'ana@seagullfilms.com', category: 'studios' },
    { id: '7', name: 'Sony Pictures', email: 'contact@sonypictures.com', website: 'https://www.sonypictures.com', category: 'distributor-companies', address: 'Culver City, CA, USA' },
    { id: '8', name: 'ARRI Rental', email: 'info@arrirental.com', phone: '+49 89 3809 0', website: 'https://www.arrirental.com', category: 'equipment-companies', address: 'Munich, Germany' },
    { id: '9', name: 'Estudio 1 - Madrid', address: 'Calle de la Industria, 12, Madrid', category: 'locations' },
  ],
  '2': [
    { id: '4', name: 'Carlos Ruiz', role: 'Productor', email: 'carlos@seagullfilms.com', category: 'coproducers' },
    { id: '5', name: 'Laura Martínez', role: 'Directora de Arte', email: 'laura@seagullfilms.com', category: 'studios' },
    { id: '10', name: 'Netflix', email: 'content@netflix.com', website: 'https://www.netflix.com', category: 'distributor-companies', address: 'Los Gatos, CA, USA' },
  ],
  '3': [
    { id: '6', name: 'Pedro Sánchez', role: 'Editor', email: 'pedro@seagullfilms.com', category: 'studios' },
  ],
};

export const mockBudgets: Record<string, BudgetItem[]> = {
  '1': [
    { id: '1', category: 'Casting', description: 'Contratación de actores principales', amount: 50000, status: 'aprobado' },
    { id: '2', category: 'Locaciones', description: 'Alquiler de estudios y exteriores', amount: 30000, status: 'aprobado' },
    { id: '3', category: 'Equipamiento', description: 'Cámaras y equipo técnico', amount: 25000, status: 'pendiente' },
  ],
  '2': [
    { id: '4', category: 'Casting', description: 'Contratación de actores', amount: 40000, status: 'pendiente' },
  ],
  '3': [
    { id: '5', category: 'Post-producción', description: 'Edición y efectos visuales', amount: 60000, status: 'aprobado' },
  ],
};

export const mockScripts: Record<string, Script[]> = {
  '1': [
    { id: '1', title: 'Guión Final', version: 'v3.2', lastModified: new Date('2024-11-15') },
    { id: '2', title: 'Guión Revisión', version: 'v3.1', lastModified: new Date('2024-11-01') },
  ],
  '2': [
    { id: '3', title: 'Primer Borrador', version: 'v1.0', lastModified: new Date('2024-10-20') },
  ],
  '3': [
    { id: '4', title: 'Guión Definitivo', version: 'v2.0', lastModified: new Date('2024-09-30') },
  ],
};

export const mockDocuments: Record<string, Document[]> = {
  '1': [
    { id: '1', name: 'Contrato_Principal.pdf', type: 'PDF', uploadedAt: new Date('2024-10-01'), size: 2048000 },
    { id: '2', name: 'Permisos_Locaciones.docx', type: 'DOCX', uploadedAt: new Date('2024-10-15'), size: 512000 },
  ],
  '2': [
    { id: '3', name: 'Presupuesto_Inicial.xlsx', type: 'XLSX', uploadedAt: new Date('2024-09-20'), size: 1024000 },
  ],
  '3': [
    { id: '4', name: 'Acuerdos_Distribucion.pdf', type: 'PDF', uploadedAt: new Date('2024-11-01'), size: 3072000 },
  ],
};

export const mockDirectors: Record<string, Director> = {
  '1': {
    id: '1',
    name: 'Alejandro Torres',
    email: 'alejandro@seagullfilms.com',
    phone: '+34 600 345 678',
    bio: 'Director con más de 15 años de experiencia en cine independiente',
  },
  '2': {
    id: '2',
    name: 'Sofía Ramírez',
    email: 'sofia@seagullfilms.com',
    phone: '+34 600 456 789',
    bio: 'Directora especializada en comedias románticas',
  },
  '3': {
    id: '3',
    name: 'Miguel Hernández',
    email: 'miguel@seagullfilms.com',
    bio: 'Director de thrillers y dramas psicológicos',
  },
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Rodaje - Escena Principal',
    date: new Date('2024-12-15'),
    time: '09:00',
    projectId: '1',
    type: 'rodaje',
  },
  {
    id: '2',
    title: 'Reunión de Producción',
    date: new Date('2024-12-10'),
    time: '14:00',
    projectId: '2',
    type: 'reunion',
  },
  {
    id: '3',
    title: 'Entrega de Primer Corte',
    date: new Date('2024-12-20'),
    projectId: '3',
    type: 'entrega',
  },
  {
    id: '4',
    title: 'Casting Abierto',
    date: new Date('2024-12-12'),
    time: '10:00',
    projectId: '2',
    type: 'otro',
  },
];

export const mockVisitors: Record<string, Visitor[]> = {
  '1': [
    {
      id: '1',
      email: 'invitado1@ejemplo.com',
      name: 'Carlos Méndez',
      invitedAt: new Date('2024-11-20'),
      projectId: '1',
      allowedTabs: ['colaboradores', 'documentos'],
      status: 'active',
    },
    {
      id: '2',
      email: 'invitado2@ejemplo.com',
      name: 'Laura Fernández',
      invitedAt: new Date('2024-12-01'),
      projectId: '1',
      allowedTabs: ['budget', 'documentos'],
      status: 'pending',
    },
  ],
  '2': [
    {
      id: '3',
      email: 'invitado3@ejemplo.com',
      name: 'Roberto Silva',
      invitedAt: new Date('2024-11-15'),
      projectId: '2',
      allowedTabs: ['colaboradores'],
      status: 'accepted',
    },
  ],
  '3': [],
};

export const mockFestivals: Festival[] = [
  {
    id: '1',
    name: 'Cannes Film Festival',
    region: 'europe',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-03-15'),
    producersHubDeadline: new Date('2025-04-01'),
    festivalStartDate: new Date('2025-05-14'),
    festivalEndDate: new Date('2025-05-25'),
    numberOfDays: 12,
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
  },
  {
    id: '2',
    name: 'Sundance Film Festival',
    region: 'north-america',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-08-15'),
    producersHubDeadline: new Date('2025-09-01'),
    festivalStartDate: new Date('2025-01-23'),
    festivalEndDate: new Date('2025-02-02'),
    numberOfDays: 11,
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
  },
  {
    id: '3',
    name: 'Berlin International Film Festival',
    region: 'europe',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-10-15'),
    producersHubDeadline: new Date('2025-11-01'),
    festivalStartDate: new Date('2025-02-13'),
    festivalEndDate: new Date('2025-02-23'),
    numberOfDays: 11,
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
  },
  {
    id: '4',
    name: 'Toronto International Film Festival',
    region: 'north-america',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-05-15'),
    producersHubDeadline: new Date('2025-06-01'),
    festivalStartDate: new Date('2025-09-04'),
    festivalEndDate: new Date('2025-09-14'),
    numberOfDays: 11,
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
  },
  {
    id: '5',
    name: 'Venice Film Festival',
    region: 'europe',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-06-15'),
    producersHubDeadline: new Date('2025-07-01'),
    festivalStartDate: new Date('2025-08-27'),
    festivalEndDate: new Date('2025-09-06'),
    numberOfDays: 11,
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
  },
  {
    id: '6',
    name: 'Busan International Film Festival',
    region: 'asia',
    year: 2025,
    filmSubmissionDeadline: new Date('2025-06-30'),
    producersHubDeadline: new Date('2025-07-15'),
    festivalStartDate: new Date('2025-10-01'),
    festivalEndDate: new Date('2025-10-10'),
    numberOfDays: 10,
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
  },
];

export const mockTasks: Record<string, Task[]> = {
  '1': [
    {
      id: '1',
      description: 'Revisión final del guión',
      assignedTo: ['1'],
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-15'),
      status: 'en-progreso',
      projectId: '1',
    },
    {
      id: '2',
      description: 'Contratación de actores principales',
      assignedTo: ['1'],
      startDate: new Date('2024-12-10'),
      endDate: new Date('2024-12-30'),
      status: 'pendiente',
      projectId: '1',
    },
    {
      id: '3',
      description: 'Preparación de locaciones',
      assignedTo: ['2'],
      startDate: new Date('2024-12-05'),
      endDate: new Date('2024-12-20'),
      status: 'pendiente',
      projectId: '1',
    },
  ],
  '2': [
    {
      id: '4',
      description: 'Desarrollo del guión',
      assignedTo: ['4'],
      startDate: new Date('2024-11-20'),
      endDate: new Date('2025-01-15'),
      status: 'en-progreso',
      projectId: '2',
    },
  ],
  '3': [
    {
      id: '5',
      description: 'Edición final del proyecto',
      assignedTo: ['6'],
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      status: 'en-progreso',
      projectId: '3',
    },
  ],
};
