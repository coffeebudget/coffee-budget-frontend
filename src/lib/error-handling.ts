import { NextResponse } from "next/server";

/**
 * Tipi di errore per categorizzazione sicura
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL'
}

/**
 * Livelli di severità per logging
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Interface per errori strutturati
 */
export interface StructuredError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  statusCode: number;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Configurazione per la gestione errori
 */
export interface ErrorConfig {
  logErrors?: boolean;
  includeStack?: boolean;
  sanitizeMessages?: boolean;
  logSensitiveData?: boolean;
  maxContextSize?: number;
}

/**
 * Messaggi utente sicuri per categoria
 */
const SAFE_USER_MESSAGES = {
  [ErrorCategory.AUTHENTICATION]: 'Authentication required. Please log in again.',
  [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorCategory.VALIDATION]: 'The provided data is invalid. Please check your input.',
  [ErrorCategory.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please try again later.',
  [ErrorCategory.EXTERNAL_API]: 'External service temporarily unavailable. Please try again.',
  [ErrorCategory.DATABASE]: 'A database error occurred. Please try again.',
  [ErrorCategory.INTERNAL]: 'An internal server error occurred. Please try again.'
};

/**
 * Status code per categoria di errore
 */
const STATUS_CODES = {
  [ErrorCategory.AUTHENTICATION]: 401,
  [ErrorCategory.AUTHORIZATION]: 403,
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.RATE_LIMIT]: 429,
  [ErrorCategory.EXTERNAL_API]: 502,
  [ErrorCategory.DATABASE]: 500,
  [ErrorCategory.INTERNAL]: 500
};

/**
 * Genera un ID univoco per l'errore
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR_${timestamp}_${random}`.toUpperCase();
}

/**
 * Sanitizza i dati sensibili dal contesto
 */
function sanitizeContext(context: Record<string, any>, maxSize: number = 1000): Record<string, any> {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'email', 'phone', 'ssn', 'credit', 'card', 'account'
  ];

  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 100) {
      sanitized[key] = value.substring(0, 100) + '...';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[OBJECT]';
    } else {
      sanitized[key] = value;
    }
  }

  // Limita la dimensione totale del contesto
  const serialized = JSON.stringify(sanitized);
  if (serialized.length > maxSize) {
    return { note: `Context too large (${serialized.length} chars), truncated` };
  }

  return sanitized;
}

/**
 * Determina la severità basata sulla categoria e contesto
 */
function determineSeverity(category: ErrorCategory, error: Error): ErrorSeverity {
  // Errori critici che richiedono attenzione immediata
  if (category === ErrorCategory.AUTHENTICATION && error.message.includes('token')) {
    return ErrorSeverity.CRITICAL;
  }
  
  if (category === ErrorCategory.DATABASE) {
    return ErrorSeverity.HIGH;
  }
  
  if (category === ErrorCategory.EXTERNAL_API) {
    return ErrorSeverity.MEDIUM;
  }
  
  if (category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.LOW;
  }
  
  return ErrorSeverity.MEDIUM;
}

/**
 * Logger sicuro per errori
 */
function logSecureError(structuredError: StructuredError, config: ErrorConfig) {
  if (!config.logErrors) return;

  const logData = {
    errorId: structuredError.id,
    category: structuredError.category,
    severity: structuredError.severity,
    message: structuredError.message,
    statusCode: structuredError.statusCode,
    timestamp: structuredError.timestamp,
    userId: structuredError.userId,
    requestId: structuredError.requestId
  };

  // Aggiungi contesto solo se non sensibile
  if (structuredError.context && config.logSensitiveData) {
    (logData as any).context = structuredError.context;
  }

  // Aggiungi stack trace solo in development
  if (config.includeStack && process.env.NODE_ENV === 'development') {
    (logData as any).stack = structuredError.stack;
  }

  // Log con livello appropriato
  switch (structuredError.severity) {
    case ErrorSeverity.CRITICAL:
      console.error('🚨 CRITICAL ERROR:', logData);
      break;
    case ErrorSeverity.HIGH:
      console.error('🔴 HIGH SEVERITY ERROR:', logData);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('🟡 MEDIUM SEVERITY ERROR:', logData);
      break;
    case ErrorSeverity.LOW:
      console.info('🔵 LOW SEVERITY ERROR:', logData);
      break;
  }
}

/**
 * Crea un errore strutturato sicuro
 */
export function createStructuredError(
  error: Error | string,
  category: ErrorCategory,
  context?: Record<string, any>,
  config: ErrorConfig = {}
): StructuredError {
  const {
    logErrors = true,
    includeStack = false,
    sanitizeMessages = true,
    logSensitiveData = false,
    maxContextSize = 1000
  } = config;

  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();
  const severity = determineSeverity(category, errorObj);

  // Sanitizza il messaggio se necessario
  const originalMessage = errorObj.message;
  const userMessage = sanitizeMessages ? SAFE_USER_MESSAGES[category] : originalMessage;

  // Sanitizza il contesto
  const sanitizedContext = context ? sanitizeContext(context, maxContextSize) : undefined;

  const structuredError: StructuredError = {
    id: errorId,
    category,
    severity,
    message: originalMessage,
    userMessage,
    statusCode: STATUS_CODES[category],
    timestamp,
    context: sanitizedContext,
    stack: includeStack ? errorObj.stack : undefined
  };

  // Log l'errore in modo sicuro
  logSecureError(structuredError, {
    logErrors,
    includeStack,
    sanitizeMessages,
    logSensitiveData,
    maxContextSize
  });

  return structuredError;
}

/**
 * Crea una risposta HTTP per l'errore
 */
export function createErrorResponse(
  structuredError: StructuredError,
  includeErrorId: boolean = true
): NextResponse {
  const responseBody: any = {
    error: structuredError.userMessage,
    category: structuredError.category
  };

  if (includeErrorId) {
    responseBody.errorId = structuredError.id;
  }

  // In development, include più dettagli
  if (process.env.NODE_ENV === 'development') {
    responseBody.details = {
      originalMessage: structuredError.message,
      timestamp: structuredError.timestamp
    };
  }

  return NextResponse.json(responseBody, { 
    status: structuredError.statusCode 
  });
}

/**
 * Helper functions per categorie comuni
 */
export const ErrorHelpers = {
  authentication: (error: Error | string, context?: Record<string, any>) =>
    createStructuredError(error, ErrorCategory.AUTHENTICATION, context),

  authorization: (error: Error | string, context?: Record<string, any>) =>
    createStructuredError(error, ErrorCategory.AUTHORIZATION, context),

  validation: (error: Error | string, context?: Record<string, any>) =>
    createStructuredError(error, ErrorCategory.VALIDATION, context),

  notFound: (resource: string, context?: Record<string, any>) =>
    createStructuredError(`${resource} not found`, ErrorCategory.NOT_FOUND, context),

  externalApi: (service: string, error: Error | string, context?: Record<string, any>) =>
    createStructuredError(`${service} API error: ${error}`, ErrorCategory.EXTERNAL_API, context),

  database: (operation: string, error: Error | string, context?: Record<string, any>) =>
    createStructuredError(`Database ${operation} failed: ${error}`, ErrorCategory.DATABASE, context),

  internal: (error: Error | string, context?: Record<string, any>) =>
    createStructuredError(error, ErrorCategory.INTERNAL, context)
};

/**
 * Decorator per API routes con gestione errori automatica
 */
export function withErrorHandling(
  handler: (...args: any[]) => Promise<NextResponse>,
  defaultCategory: ErrorCategory = ErrorCategory.INTERNAL
) {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const structuredError = createStructuredError(
        error as Error,
        defaultCategory,
        { args: args.map(arg => typeof arg) } // Solo i tipi, non i valori
      );
      
      return createErrorResponse(structuredError);
    }
  };
}

/**
 * Middleware per catturare errori non gestiti
 */
export function setupGlobalErrorHandler() {
  // Cattura errori non gestiti
  if (typeof window === 'undefined') { // Server-side only
    process.on('unhandledRejection', (reason, promise) => {
      const structuredError = createStructuredError(
        reason as Error,
        ErrorCategory.INTERNAL,
        { type: 'unhandledRejection', promise: '[Promise]' }
      );
      
      console.error('🚨 Unhandled Promise Rejection:', structuredError);
    });

    process.on('uncaughtException', (error) => {
      const structuredError = createStructuredError(
        error,
        ErrorCategory.INTERNAL,
        { type: 'uncaughtException' }
      );
      
      console.error('🚨 Uncaught Exception:', structuredError);
      
      // In produzione, potresti voler terminare il processo
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  }
} 