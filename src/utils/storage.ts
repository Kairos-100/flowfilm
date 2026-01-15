/**
 * Obtiene la clave de localStorage específica para un usuario
 */
export function getUserStorageKey(key: string, userId: string | null): string {
  if (!userId) {
    return key; // Fallback para usuarios no autenticados
  }
  return `${key}_${userId}`;
}

/**
 * Limpia todas las claves de localStorage de un usuario específico
 */
export function clearUserData(userId: string) {
  const keys = [
    'projects',
    'collaborators',
    'budgets',
    'scripts',
    'documents',
    'directors',
    'visitors',
    'tasks',
    'customCategories',
    'customSubcategories',
    'customStatuses',
    'customCollaboratorCategories',
    'globalContacts',
    'festivals',
    'readNotifications',
    'calendarEvents',
    'google_access_token',
    'google_token_expiry',
    'google_refresh_token',
  ];

  keys.forEach(key => {
    localStorage.removeItem(`${key}_${userId}`);
  });
}

