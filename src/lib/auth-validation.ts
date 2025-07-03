import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Interface per la sessione validata
 */
export interface ValidatedSession {
  user: {
    id: string;
    email: string;
    accessToken: string;
  };
}

/**
 * Tipi di errore per la validazione
 */
export enum AuthValidationError {
  NO_SESSION = 'NO_SESSION',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  MALFORMED_TOKEN = 'MALFORMED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

/**
 * Risultato della validazione
 */
export interface ValidationResult {
  success: boolean;
  session?: ValidatedSession;
  error?: AuthValidationError;
  message?: string;
}

/**
 * Configurazione per la validazione
 */
export interface ValidationConfig {
  requireEmail?: boolean;
  requireUserId?: boolean;
  logErrors?: boolean;
  customScopes?: string[];
}

/**
 * Valida la struttura del token JWT
 */
function isValidJWTStructure(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // JWT deve avere 3 parti separate da punti
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Ogni parte deve essere base64url encoded
  try {
    parts.forEach(part => {
      if (!part) throw new Error('Empty part');
      // Verifica che sia una stringa base64url valida
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida il payload del token
 */
function validateTokenPayload(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Verifica campi obbligatori JWT
    if (!payload.sub || !payload.iat || !payload.exp) {
      return { valid: false };
    }
    
    // Verifica scadenza
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false };
    }
    
    // Verifica audience se presente
    if (payload.aud && process.env.NEXT_PUBLIC_AUTH0_AUDIENCE) {
      const validAudience = Array.isArray(payload.aud)
        ? payload.aud.includes(process.env.NEXT_PUBLIC_AUTH0_AUDIENCE)
        : payload.aud === process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
      
      if (!validAudience) {
        return { valid: false };
      }
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Validazione robusta della sessione e del token
 */
export async function validateAuthSession(
  config: ValidationConfig = {}
): Promise<ValidationResult> {
  const {
    requireEmail = true,
    requireUserId = true,
    logErrors = false,
    customScopes = []
  } = config;

  try {
    // 1. Ottieni la sessione
    const session = await getServerSession(authOptions);
    
    if (!session) {
      if (logErrors) console.warn('🔒 Auth validation failed: No session found');
      return {
        success: false,
        error: AuthValidationError.NO_SESSION,
        message: 'No active session found'
      };
    }

    // 2. Verifica struttura sessione
    if (!session.user) {
      if (logErrors) console.warn('🔒 Auth validation failed: No user in session');
      return {
        success: false,
        error: AuthValidationError.INVALID_TOKEN,
        message: 'Invalid session structure'
      };
    }

    // 3. Verifica access token
    const accessToken = session.user.accessToken;
    if (!accessToken) {
      if (logErrors) console.warn('🔒 Auth validation failed: No access token');
      return {
        success: false,
        error: AuthValidationError.INVALID_TOKEN,
        message: 'No access token found'
      };
    }

    // 4. Valida struttura JWT
    if (!isValidJWTStructure(accessToken)) {
      if (logErrors) console.warn('🔒 Auth validation failed: Malformed JWT');
      return {
        success: false,
        error: AuthValidationError.MALFORMED_TOKEN,
        message: 'Invalid token format'
      };
    }

    // 5. Valida payload del token
    const { valid: payloadValid, payload } = validateTokenPayload(accessToken);
    if (!payloadValid) {
      if (logErrors) console.warn('🔒 Auth validation failed: Invalid token payload');
      return {
        success: false,
        error: AuthValidationError.EXPIRED_TOKEN,
        message: 'Token expired or invalid'
      };
    }

    // 6. Verifica campi richiesti
    if (requireUserId && !session.user.id) {
      if (logErrors) console.warn('🔒 Auth validation failed: Missing user ID');
      return {
        success: false,
        error: AuthValidationError.INVALID_TOKEN,
        message: 'User ID not found in session'
      };
    }

    if (requireEmail && !session.user.email) {
      if (logErrors) console.warn('🔒 Auth validation failed: Missing email');
      return {
        success: false,
        error: AuthValidationError.INVALID_TOKEN,
        message: 'Email not found in session'
      };
    }

    // 7. Verifica scope personalizzati (se richiesti)
    if (customScopes.length > 0 && payload.scope) {
      const tokenScopes = payload.scope.split(' ');
      const hasRequiredScopes = customScopes.every(scope => 
        tokenScopes.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        if (logErrors) console.warn('🔒 Auth validation failed: Insufficient permissions');
        return {
          success: false,
          error: AuthValidationError.INSUFFICIENT_PERMISSIONS,
          message: 'Insufficient permissions for this operation'
        };
      }
    }

    // ✅ Validazione completata con successo
    return {
      success: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          accessToken: accessToken
        }
      }
    };

  } catch (error) {
    if (logErrors) {
      console.error('🔒 Auth validation error:', error);
    }
    
    return {
      success: false,
      error: AuthValidationError.INVALID_TOKEN,
      message: 'Authentication validation failed'
    };
  }
}

/**
 * Helper per creare risposte di errore standardizzate
 */
export function createAuthErrorResponse(
  error: AuthValidationError,
  message?: string
): NextResponse {
  const errorMessages = {
    [AuthValidationError.NO_SESSION]: 'Authentication required',
    [AuthValidationError.INVALID_TOKEN]: 'Invalid authentication token',
    [AuthValidationError.EXPIRED_TOKEN]: 'Authentication token expired',
    [AuthValidationError.MALFORMED_TOKEN]: 'Malformed authentication token',
    [AuthValidationError.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions'
  };

  const statusCodes = {
    [AuthValidationError.NO_SESSION]: 401,
    [AuthValidationError.INVALID_TOKEN]: 401,
    [AuthValidationError.EXPIRED_TOKEN]: 401,
    [AuthValidationError.MALFORMED_TOKEN]: 400,
    [AuthValidationError.INSUFFICIENT_PERMISSIONS]: 403
  };

  return NextResponse.json(
    { 
      error: message || errorMessages[error],
      code: error
    },
    { status: statusCodes[error] }
  );
}

/**
 * Decorator per API routes che require autenticazione
 */
export function withAuth(
  handler: (validatedSession: ValidatedSession, ...args: any[]) => Promise<NextResponse>,
  config: ValidationConfig = {}
) {
  return async (...args: any[]): Promise<NextResponse> => {
    const validation = await validateAuthSession(config);
    
    if (!validation.success || !validation.session) {
      return createAuthErrorResponse(
        validation.error!,
        validation.message
      );
    }
    
    return handler(validation.session, ...args);
  };
} 