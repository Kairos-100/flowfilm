export type ProjectCategory = 'originals' | 'co-productions' | 'commissions';
export type ProjectSubcategory = 
  | 'feature-film' 
  | 'documentary' 
  | 'audiovisual' 
  | 'tv-series' 
  | 'short-film' 
  | 'commercial';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'pre-produccion' | 'produccion' | 'post-produccion' | 'completado';
  category: ProjectCategory;
  subcategory: ProjectSubcategory;
  region?: FestivalRegion; // Región principal del proyecto
  country?: string; // País específico (ej: "Corea del Sur", "Japón")
  createdAt: Date;
  updatedAt: Date;
}

export type CollaboratorCategory = 'coproducers' | 'distributor-companies' | 'studios' | 'equipment-companies' | 'locations';

export interface Collaborator {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  category: CollaboratorCategory;
  language?: string[]; // Idiomas de comunicación (códigos ISO: ['es', 'en', 'fr', etc.] o nombres personalizados)
  address?: string; // Para locations y companies
  website?: string;
  notes?: string;
  allergies?: string; // Alergias del contacto
  hasDrivingLicense?: boolean; // Indica si tiene carnet de conducir
  isVisitor?: boolean; // Indica si es un visitante
  allowedTabs?: TabType[]; // Pestañas permitidas para visitantes
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  status: 'aprobado' | 'pendiente' | 'rechazado';
}

export type DocumentCategory = 
  | 'script' 
  | 'contract' 
  | 'invoice' 
  | 'budget' 
  | 'legal' 
  | 'production' 
  | 'marketing' 
  | 'other';

export interface Script {
  id: string;
  title: string;
  version: string;
  lastModified: Date;
  content?: string;
  category?: 'script';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category?: DocumentCategory;
  uploadedAt: Date;
  size: number;
  isDriveFile?: boolean;
  driveFolderId?: string;
}

export interface ProjectDriveConfig {
  projectId: string;
  enabledFolders: string[];
}

export interface Director {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  projectId?: string;
  type: 'rodaje' | 'reunion' | 'entrega' | 'otro';
}

export type UserRole = 'admin' | 'member' | 'visitor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type TabType = 'colaboradores' | 'budget' | 'documentos' | 'tareas';

export interface Task {
  id: string;
  description: string;
  assignedTo: string[]; // IDs de los colaboradores (múltiples)
  startDate: Date;
  endDate: Date;
  status: 'pendiente' | 'en-progreso' | 'completada';
  projectId: string;
}

export interface Visitor {
  id: string;
  email: string;
  name: string;
  invitedAt: Date;
  projectId: string;
  allowedTabs: TabType[];
  status: 'pending' | 'accepted' | 'active';
}

export type FestivalRegion = 'europe' | 'north-america' | 'south-america' | 'asia' | 'africa' | 'oceania' | 'middle-east';

export interface Festival {
  id: string;
  name: string;
  region: FestivalRegion;
  year: number;
  filmSubmissionDeadline: Date;
  producersHubDeadline: Date;
  festivalStartDate: Date;
  festivalEndDate: Date;
  numberOfDays: number;
  contacts: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  }[];
  website?: string;
  location?: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  projectId?: string; // Opcional: asociar email a un proyecto
  threadId?: string; // ID del thread de Gmail
  snippet?: string; // Snippet del email
  cc?: string; // Campo CC
  bcc?: string; // Campo BCC
  replyTo?: string; // Campo Reply-To
  labelIds?: string[]; // Labels de Gmail
  sizeEstimate?: number; // Tamaño estimado del email
}

export interface Notification {
  id: string;
  type: 'task-overdue' | 'task-due-soon' | 'task-starting-soon' | 'task-completed';
  title: string;
  message: string;
  projectId: string;
  projectTitle: string;
  taskId: string;
  taskDescription: string;
  date: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}
