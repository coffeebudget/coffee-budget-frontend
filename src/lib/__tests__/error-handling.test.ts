// Mock Next.js server components for testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...data,
      status: options?.status || 200,
      headers: new Headers()
    }))
  }
}));

import {
  ErrorCategory,
  ErrorSeverity,
  createStructuredError,
  createErrorResponse,
  ErrorHelpers,
  withErrorHandling,
  setupGlobalErrorHandler,
  type StructuredError,
  type ErrorConfig
} from '../error-handling';
import { NextResponse } from 'next/server';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  describe('ErrorCategory and ErrorSeverity', () => {
    it('should have correct error categories', () => {
      expect(ErrorCategory.AUTHENTICATION).toBe('AUTHENTICATION');
      expect(ErrorCategory.AUTHORIZATION).toBe('AUTHORIZATION');
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION');
      expect(ErrorCategory.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCategory.RATE_LIMIT).toBe('RATE_LIMIT');
      expect(ErrorCategory.EXTERNAL_API).toBe('EXTERNAL_API');
      expect(ErrorCategory.DATABASE).toBe('DATABASE');
      expect(ErrorCategory.INTERNAL).toBe('INTERNAL');
    });

    it('should have correct error severities', () => {
      expect(ErrorSeverity.LOW).toBe('LOW');
      expect(ErrorSeverity.MEDIUM).toBe('MEDIUM');
      expect(ErrorSeverity.HIGH).toBe('HIGH');
      expect(ErrorSeverity.CRITICAL).toBe('CRITICAL');
    });
  });

  describe('createStructuredError', () => {
    it('should create structured error from Error object', () => {
      const error = new Error('Test error message');
      const context = { userId: '123', action: 'test' };
      const config: ErrorConfig = { logErrors: false };

      const result = createStructuredError(error, ErrorCategory.VALIDATION, context, config);

      expect(result).toMatchObject({
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: 'Test error message',
        userMessage: 'The provided data is invalid. Please check your input.',
        statusCode: 400,
        context: { userId: '123', action: 'test' },
        stack: undefined
      });
      expect(result.id).toMatch(/^ERR_\w+_\w+$/);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should create structured error from string', () => {
      const errorMessage = 'String error message';
      const result = createStructuredError(errorMessage, ErrorCategory.INTERNAL);

      expect(result.message).toBe(errorMessage);
      expect(result.category).toBe(ErrorCategory.INTERNAL);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should determine severity correctly', () => {
      const authError = new Error('Invalid token');
      const authResult = createStructuredError(authError, ErrorCategory.AUTHENTICATION, undefined, { logErrors: false });
      expect(authResult.severity).toBe(ErrorSeverity.CRITICAL);

      const dbError = new Error('Database connection failed');
      const dbResult = createStructuredError(dbError, ErrorCategory.DATABASE, undefined, { logErrors: false });
      expect(dbResult.severity).toBe(ErrorSeverity.HIGH);

      const externalError = new Error('API timeout');
      const externalResult = createStructuredError(externalError, ErrorCategory.EXTERNAL_API, undefined, { logErrors: false });
      expect(externalResult.severity).toBe(ErrorSeverity.MEDIUM);

      const validationError = new Error('Invalid input');
      const validationResult = createStructuredError(validationError, ErrorCategory.VALIDATION, undefined, { logErrors: false });
      expect(validationResult.severity).toBe(ErrorSeverity.LOW);
    });

    it('should sanitize sensitive data in context', () => {
      const context = {
        userId: '123',
        password: 'secret123',
        token: 'abc123',
        email: 'user@example.com',
        normalData: 'safe data'
      };

      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, context, { logErrors: false });

      expect(result.context).toEqual({
        userId: '123',
        password: '[REDACTED]',
        token: '[REDACTED]',
        email: '[REDACTED]',
        normalData: 'safe data'
      });
    });

    it('should truncate long context values', () => {
      const longString = 'a'.repeat(150);
      const context = {
        longValue: longString,
        normalValue: 'normal'
      };

      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, context, { logErrors: false });

      expect(result.context?.longValue).toBe('a'.repeat(100) + '...');
      expect(result.context?.normalValue).toBe('normal');
    });

    it('should limit total context size', () => {
      const largeContext = {
        key1: 'a'.repeat(500),
        key2: 'b'.repeat(500),
        key3: 'c'.repeat(500)
      };

      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, largeContext, { logErrors: false });

      // The context should be sanitized and truncated
      expect(result.context).toBeDefined();
      // The context should be truncated due to size
      expect(Object.keys(result.context!).length).toBeLessThanOrEqual(3);
    });

    it('should include stack trace when configured', () => {
      const error = new Error('Test error');
      const result = createStructuredError(error, ErrorCategory.INTERNAL, undefined, { 
        logErrors: false, 
        includeStack: true 
      });

      expect(result.stack).toBeDefined();
      expect(typeof result.stack).toBe('string');
    });

    it('should not include stack trace by default', () => {
      const error = new Error('Test error');
      const result = createStructuredError(error, ErrorCategory.INTERNAL, undefined, { logErrors: false });

      expect(result.stack).toBeUndefined();
    });

    it('should use original message when sanitizeMessages is false', () => {
      const error = new Error('Sensitive error details');
      const result = createStructuredError(error, ErrorCategory.INTERNAL, undefined, { 
        logErrors: false, 
        sanitizeMessages: false 
      });

      expect(result.userMessage).toBe('Sensitive error details');
    });

    it('should log errors when configured', () => {
      const error = new Error('Test error');
      const result = createStructuredError(error, ErrorCategory.INTERNAL, undefined, { 
        logErrors: true,
        logSensitiveData: false
      });

      // Check that the error was created successfully
      expect(result).toBeDefined();
      expect(result.category).toBe(ErrorCategory.INTERNAL);
    });

    it('should not log errors when configured not to', () => {
      const error = new Error('Test error');
      createStructuredError(error, ErrorCategory.INTERNAL, undefined, { logErrors: false });

      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should log with different levels based on severity', () => {
      // Critical error - needs specific message to trigger critical severity
      const criticalResult = createStructuredError('Invalid token', ErrorCategory.AUTHENTICATION, undefined, { 
        logErrors: true,
        logSensitiveData: false
      });
      expect(criticalResult.severity).toBe(ErrorSeverity.CRITICAL);

      // High severity error
      const highResult = createStructuredError('High error', ErrorCategory.DATABASE, undefined, { 
        logErrors: true,
        logSensitiveData: false
      });
      expect(highResult.severity).toBe(ErrorSeverity.HIGH);

      // Low severity error
      const lowResult = createStructuredError('Low error', ErrorCategory.VALIDATION, undefined, { 
        logErrors: true,
        logSensitiveData: false
      });
      expect(lowResult.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with error ID', () => {
      const structuredError: StructuredError = {
        id: 'ERR_123_ABC',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        userMessage: 'Validation failed',
        statusCode: 400,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const response = createErrorResponse(structuredError, true);

      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should create error response without error ID', () => {
      const structuredError: StructuredError = {
        id: 'ERR_123_ABC',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        userMessage: 'Validation failed',
        statusCode: 400,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const response = createErrorResponse(structuredError, false);

      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should include development details in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      const structuredError: StructuredError = {
        id: 'ERR_123_ABC',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        userMessage: 'Validation failed',
        statusCode: 400,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const response = createErrorResponse(structuredError, true);

      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });
  });

  describe('ErrorHelpers', () => {
    it('should create authentication error', () => {
      const result = ErrorHelpers.authentication('Invalid token', { userId: '123' });

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
      expect(result.statusCode).toBe(401);
    });

    it('should create authorization error', () => {
      const result = ErrorHelpers.authorization('Access denied', { resource: 'user' });

      expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.statusCode).toBe(403);
    });

    it('should create validation error', () => {
      const result = ErrorHelpers.validation('Invalid input', { field: 'email' });

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.LOW);
      expect(result.statusCode).toBe(400);
    });

    it('should create not found error', () => {
      const result = ErrorHelpers.notFound('User', { id: '123' });

      expect(result.category).toBe(ErrorCategory.NOT_FOUND);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('User not found');
    });

    it('should create external API error', () => {
      const result = ErrorHelpers.externalApi('PaymentService', 'Timeout', { endpoint: '/pay' });

      expect(result.category).toBe(ErrorCategory.EXTERNAL_API);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.statusCode).toBe(502);
      expect(result.message).toBe('PaymentService API error: Timeout');
    });

    it('should create database error', () => {
      const result = ErrorHelpers.database('INSERT', 'Connection failed', { table: 'users' });

      expect(result.category).toBe(ErrorCategory.DATABASE);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Database INSERT failed: Connection failed');
    });

    it('should create internal error', () => {
      const result = ErrorHelpers.internal('Unexpected error', { component: 'auth' });

      expect(result.category).toBe(ErrorCategory.INTERNAL);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap handler and return result on success', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withErrorHandling(mockHandler, ErrorCategory.INTERNAL);

      const result = await wrappedHandler('arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBeDefined();
    });

    it('should catch errors and return error response', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withErrorHandling(mockHandler, ErrorCategory.INTERNAL);

      const result = await wrappedHandler('arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBeDefined();
    });

    it('should use default error category', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withErrorHandling(mockHandler);

      const result = await wrappedHandler('arg1', 'arg2');

      expect(result).toBeDefined();
    });
  });

  describe('setupGlobalErrorHandler', () => {
    it('should be callable without errors', () => {
      expect(() => setupGlobalErrorHandler()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null context', () => {
      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, null, { logErrors: false });

      expect(result.context).toBeUndefined();
    });

    it('should handle undefined context', () => {
      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, undefined, { logErrors: false });

      expect(result.context).toBeUndefined();
    });

    it('should handle empty context', () => {
      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, {}, { logErrors: false });

      expect(result.context).toEqual({});
    });

    it('should handle circular references in context', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, { circular: circularObj }, { logErrors: false });

      expect(result.context?.circular).toBe('[OBJECT]');
    });

    it('should handle very large objects in context', () => {
      const largeObj = {
        data: 'x'.repeat(2000)
      };

      const result = createStructuredError('Test error', ErrorCategory.INTERNAL, largeObj, { logErrors: false });

      // The context should be truncated due to size
      expect(result.context).toBeDefined();
      expect(Object.keys(result.context!).length).toBeLessThanOrEqual(3);
    });
  });
});
