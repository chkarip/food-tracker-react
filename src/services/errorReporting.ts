/**
 * errorReporting.ts - Comprehensive Error Reporting System
 * 
 * BUSINESS PURPOSE:
 * Provides real-time error tracking and reporting to help maintain app stability:
 * - Captures all JavaScript errors, unhandled rejections, and React errors
 * - Logs errors to Firebase Analytics for monitoring and debugging
 * - Sends critical error notifications via Firebase Cloud Functions
 * - Provides user context (browser, device, location) for better debugging
 * - Tracks error frequency and patterns for proactive maintenance
 * 
 * KEY FEATURES:
 * 1. AUTOMATIC ERROR CAPTURE: Catches all uncaught errors and promise rejections
 * 2. FIREBASE ANALYTICS: Logs errors with full context and stack traces
 * 3. EMAIL NOTIFICATIONS: Sends critical errors to admin (via Cloud Function)
 * 4. USER CONTEXT: Captures browser, device, page, user ID for debugging
 * 5. SEVERITY LEVELS: Categorizes errors (critical, error, warning, info)
 * 6. DEDUPLICATION: Prevents spam by tracking recently reported errors
 * 7. PRIVACY: Sanitizes sensitive data before reporting
 * 
 * ERROR SEVERITY LEVELS:
 * - CRITICAL: App-breaking errors (auth failures, data loss, crashes)
 * - ERROR: Feature failures (save failed, API errors, validation errors)
 * - WARNING: Non-critical issues (slow performance, deprecated features)
 * - INFO: Informational events (user actions, navigation)
 */

import { logEvent } from 'firebase/analytics';
import { analytics, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

// Error severity levels
export enum ErrorSeverity {
  CRITICAL = 'critical',  // App-breaking errors requiring immediate attention
  ERROR = 'error',        // Feature failures requiring investigation
  WARNING = 'warning',    // Non-critical issues to monitor
  INFO = 'info'          // Informational events
}

// Error context interface
export interface ErrorContext {
  severity?: ErrorSeverity;
  userId?: string;
  page?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

// Error report interface
interface ErrorReport {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  page?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

// Deduplication cache - prevents spam of identical errors
const recentErrors = new Map<string, number>();
const ERROR_THROTTLE_MS = 60000; // Don't report same error more than once per minute

/**
 * Generate a unique hash for error deduplication
 */
function getErrorHash(message: string, stack?: string): string {
  const stackLine = stack?.split('\n')[1] || '';
  return `${message}-${stackLine}`.substring(0, 100);
}

/**
 * Check if error was recently reported (throttling)
 */
function shouldReportError(errorHash: string): boolean {
  const lastReported = recentErrors.get(errorHash);
  const now = Date.now();
  
  if (lastReported && now - lastReported < ERROR_THROTTLE_MS) {
    return false; // Don't report duplicate error within throttle window
  }
  
  recentErrors.set(errorHash, now);
  
  // Clean up old entries (older than 5 minutes)
  const entriesToDelete: string[] = [];
  recentErrors.forEach((timestamp, hash) => {
    if (now - timestamp > 300000) {
      entriesToDelete.push(hash);
    }
  });
  entriesToDelete.forEach(hash => recentErrors.delete(hash));
  
  return true;
}

/**
 * Sanitize error data to remove sensitive information
 */
function sanitizeErrorData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};
  const sensitiveKeys = ['password', 'token', 'apikey', 'secret', 'authorization'];

  for (const key in data) {
    const lowerKey = key.toLowerCase();
    
    // Remove sensitive fields
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object') {
      sanitized[key] = sanitizeErrorData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

/**
 * Get browser and device context
 */
function getDeviceContext() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    isPWA: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone,
    isOnline: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,
  };
}

/**
 * Main error reporting function
 */
export async function reportError(
  error: Error | string,
  context: ErrorContext = {}
): Promise<void> {
  try {
    // Convert string errors to Error objects
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Generate error hash for deduplication
    const errorHash = getErrorHash(errorObj.message, errorObj.stack);
    
    // Check if we should report this error (throttling)
    if (!shouldReportError(errorHash)) {
      console.log('[Error Reporting] Throttled duplicate error:', errorObj.message);
      return;
    }

    // Build error report
    const errorReport: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      severity: context.severity || ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: context.userId,
      page: context.page || window.location.pathname,
      action: context.action,
      component: context.component,
      metadata: sanitizeErrorData({
        ...context.metadata,
        deviceContext: getDeviceContext()
      })
    };

    // Log to console for development
    console.error('[Error Report]', {
      severity: errorReport.severity,
      message: errorReport.message,
      context: context,
      stack: errorReport.stack
    });

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'app_error', {
        error_severity: errorReport.severity,
        error_message: errorReport.message.substring(0, 100), // Analytics has length limits
        error_page: errorReport.page,
        error_component: errorReport.component,
        error_action: errorReport.action,
        is_pwa: errorReport.metadata?.deviceContext?.isPWA,
        user_id: errorReport.userId || 'anonymous'
      });
      
      console.log('[Error Reporting] Logged to Firebase Analytics');
    }

    // Send critical errors via email (Cloud Function)
    if (errorReport.severity === ErrorSeverity.CRITICAL) {
      try {
        const sendErrorEmail = httpsCallable(functions, 'sendErrorEmail');
        
        await sendErrorEmail({
          subject: `🚨 CRITICAL ERROR: ${errorReport.message.substring(0, 50)}`,
          errorReport: {
            message: errorReport.message,
            stack: errorReport.stack?.substring(0, 500), // Limit stack trace length
            severity: errorReport.severity,
            timestamp: errorReport.timestamp,
            url: errorReport.url,
            page: errorReport.page,
            userId: errorReport.userId || 'anonymous',
            deviceInfo: errorReport.metadata?.deviceContext
          }
        });
        
        console.log('[Error Reporting] Critical error email sent');
      } catch (emailError) {
        console.error('[Error Reporting] Failed to send email:', emailError);
        // Don't throw - email failure shouldn't break error reporting
      }
    }

  } catch (reportingError) {
    // If error reporting itself fails, log to console only
    console.error('[Error Reporting] Failed to report error:', reportingError);
    console.error('[Error Reporting] Original error:', error);
  }
}

/**
 * Report error with automatic severity detection
 */
export function reportErrorAuto(error: Error | string, context?: ErrorContext): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const message = errorObj.message.toLowerCase();
  
  // Auto-detect severity based on error message
  let severity = ErrorSeverity.ERROR;
  
  if (message.includes('auth') || 
      message.includes('permission') || 
      message.includes('crash') ||
      message.includes('fatal') ||
      message.includes('cannot read') ||
      message.includes('undefined is not')) {
    severity = ErrorSeverity.CRITICAL;
  } else if (message.includes('warning') || 
             message.includes('deprecated') ||
             message.includes('slow')) {
    severity = ErrorSeverity.WARNING;
  }
  
  reportError(errorObj, { ...context, severity });
}

/**
 * Initialize global error handlers
 */
export function initializeErrorReporting(userId?: string): void {
  console.log('[Error Reporting] Initializing global error handlers...');

  // Catch uncaught JavaScript errors
  window.addEventListener('error', (event: ErrorEvent) => {
    reportError(event.error || event.message, {
      severity: ErrorSeverity.CRITICAL,
      userId,
      page: window.location.pathname,
      action: 'uncaught_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    reportError(error, {
      severity: ErrorSeverity.CRITICAL,
      userId,
      page: window.location.pathname,
      action: 'unhandled_rejection'
    });
  });

  // Catch Service Worker errors
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', (event: Event) => {
      reportError('Service Worker Error', {
        severity: ErrorSeverity.ERROR,
        userId,
        component: 'ServiceWorker',
        metadata: { event }
      });
    });
  }

  console.log('[Error Reporting] Global error handlers initialized ✅');
}

/**
 * Report info-level events (non-errors)
 */
export function reportInfo(message: string, context?: ErrorContext): void {
  if (analytics) {
    logEvent(analytics, 'app_info', {
      info_message: message,
      info_page: context?.page || window.location.pathname,
      info_action: context?.action,
      user_id: context?.userId || 'anonymous'
    });
  }
}

/**
 * Report performance issues
 */
export function reportPerformance(metric: string, value: number, threshold: number): void {
  if (value > threshold && analytics) {
    logEvent(analytics, 'performance_issue', {
      metric_name: metric,
      metric_value: value,
      threshold_value: threshold,
      page: window.location.pathname
    });
    
    console.warn(`[Performance] ${metric} exceeded threshold: ${value}ms > ${threshold}ms`);
  }
}
