/**
 * Hooks de autenticación.
 * Se exportan por separado para evitar problemas con React Fast Refresh.
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Hook para acceder al contexto de autenticación.
 * Lanza un error si se usa fuera de un AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Exportar el contexto para tests
export { AuthContext };
