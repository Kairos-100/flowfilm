# Seagull Films - Plataforma de Gestión de Proyectos

Plataforma de gestión al estilo Notion para productoras de cine, diseñada para gestionar proyectos cinematográficos de manera eficiente.

## Características

- **Página Principal**: Lista de todos los proyectos con estados y descripciones
- **Vista de Proyecto**: Gestión completa de cada proyecto con las siguientes secciones:
  - **Colaboradores**: Lista de miembros del equipo con información de contacto
  - **Budget**: Presupuesto detallado con categorías y estados de aprobación
  - **Guiones**: Gestión de versiones de guiones
  - **Director**: Información del director asignado
  - **Documentos**: Archivos y documentos relacionados
- **Calendario**: Vista mensual con eventos de rodaje, reuniones y entregas

## Tecnologías

- React 18
- TypeScript
- Vite
- React Router
- Lucide React (iconos)
- date-fns (manejo de fechas)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación se abrirá en `http://localhost:5174`

## Construcción

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal con sidebar
│   └── project/        # Componentes de las pestañas del proyecto
├── pages/              # Páginas principales
│   ├── Home.tsx        # Lista de proyectos
│   ├── Project.tsx     # Vista de proyecto individual
│   └── Calendar.tsx    # Calendario de eventos
├── types/              # Definiciones de TypeScript
├── data/               # Datos mock para desarrollo
└── App.tsx             # Componente principal con rutas
```

## Características de Diseño

- Interfaz limpia y moderna inspirada en Notion
- Diseño responsive
- Navegación intuitiva
- Colores y estados visuales claros
- Transiciones suaves

## Configuración de Variables de Entorno

Para que la aplicación funcione correctamente, necesitas configurar las siguientes variables de entorno. Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5174/auth/google/callback
```

### Cómo obtener las credenciales de Google OAuth:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Google Calendar API
   - Gmail API
   - Google Drive API
4. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configura la aplicación como "Web application"
6. Agrega las URIs de redirección autorizadas:
   - `http://localhost:5174/auth/google/callback` (desarrollo)
   - `https://tu-app.vercel.app/auth/google/callback` (producción)

## 🚀 Despliegue

### Desplegar en Vercel

1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com) e inicia sesión con GitHub
3. Importa tu repositorio
4. Configura las variables de entorno en Vercel:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_CLIENT_SECRET`
   - `VITE_GOOGLE_REDIRECT_URI` (debe ser la URL de producción)
5. Haz clic en "Deploy"

**Importante:** Después del despliegue, actualiza la URI de redirección en Google Cloud Console con la URL de producción de Vercel.

## Características Principales

- ✅ Gestión de proyectos cinematográficos
- ✅ Integración con Google Calendar
- ✅ Integración con Gmail para envío de correos
- ✅ Integración con Google Drive para documentos
- ✅ Sistema de notificaciones de tareas
- ✅ Calendario de festivales cinematográficos
- ✅ Gestión de colaboradores y presupuestos