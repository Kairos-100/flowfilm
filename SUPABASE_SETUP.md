# Configuración de Supabase

Esta guía te ayudará a conectar Supabase con tu proyecto.

## Paso 1: Crear cuenta y proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - Haz clic en "New Project"
   - Completa la información del proyecto (nombre, contraseña de base de datos, región)
   - Espera a que se complete la configuración (puede tardar unos minutos)

## Paso 2: Obtener las credenciales de API

1. En el Dashboard de Supabase, ve a **Settings** → **API**
2. Encontrarás dos valores importantes:
   - **Project URL**: Esta es tu `VITE_SUPABASE_URL`
   - **anon public key**: Esta es tu `VITE_SUPABASE_ANON_KEY`

## Paso 3: Configurar variables de entorno

1. Copia el archivo `.env.example` y créalo como `.env` en la raíz del proyecto:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y reemplaza los valores de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

## Paso 4: Instalar dependencias

Ejecuta el siguiente comando para instalar la librería de Supabase:

```bash
npm install
```

Esto instalará `@supabase/supabase-js` que ya está agregado en el `package.json`.

## Paso 5: Verificar la conexión

El cliente de Supabase ya está configurado en `src/lib/supabase.ts`. Puedes importarlo en cualquier componente:

```typescript
import { supabase } from '../lib/supabase';
```

## Uso básico

### Autenticación

```typescript
// Iniciar sesión
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});

// Registrar usuario
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});

// Cerrar sesión
await supabase.auth.signOut();

// Obtener usuario actual
const { data: { user } } = await supabase.auth.getUser();
```

### Consultas a la base de datos

```typescript
// Leer datos
const { data, error } = await supabase
  .from('tabla')
  .select('*');

// Insertar datos
const { data, error } = await supabase
  .from('tabla')
  .insert([{ columna: 'valor' }]);

// Actualizar datos
const { data, error } = await supabase
  .from('tabla')
  .update({ columna: 'nuevo_valor' })
  .eq('id', 1);

// Eliminar datos
const { data, error } = await supabase
  .from('tabla')
  .delete()
  .eq('id', 1);
```

## Próximos pasos

Una vez configurado Supabase, puedes:

1. Crear las tablas necesarias en el SQL Editor de Supabase
2. Configurar Row Level Security (RLS) para control de acceso
3. Implementar autenticación con Supabase Auth
4. Migrar datos de localStorage a Supabase

## Recursos útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de autenticación](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
