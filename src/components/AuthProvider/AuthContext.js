/**
 * Contexto de autenticación.
 * Se exporta por separado para cumplir con React Fast Refresh.
 */

import { createContext } from 'react';

/**
 * Contexto de autenticación
 */
const AuthContext = createContext(null);

export { AuthContext };
