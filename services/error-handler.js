/**
 * 🛡️ Error Handler Service
 * Provides comprehensive error handling and boundaries for the extension
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.errorCallbacks = new Map();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Global JavaScript errors
    window.addEventListener("error", (event) => {
      this.logError({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
      });
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        type: "promise_rejection",
        message: event.reason?.message || "Unhandled promise rejection",
        reason: event.reason,
        timestamp: new Date().toISOString(),
      });
    });

    // Chrome extension errors
    if (chrome?.runtime) {
      chrome.runtime.onStartup?.addListener(() => {
        if (chrome.runtime.lastError) {
          this.logError({
            type: "chrome_runtime",
            message: chrome.runtime.lastError.message,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Log error with context
   * @param {object} errorData - Error information
   */
  logError(errorData) {
    const errorEntry = {
      id: this.generateErrorId(),
      ...errorData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: errorData.error?.stack,
    };

    // Add to log
    this.errorLog.unshift(errorEntry);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging for development
    console.error("🛡️ Error logged:", errorEntry);

    // Trigger callbacks
    this.triggerErrorCallbacks(errorEntry);

    // Store in storage for persistence
    this.persistError(errorEntry);
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wrap function with error boundary
   * @param {Function} fn - Function to wrap
   * @param {object} options - Options
   * @returns {Function} Wrapped function
   */
  wrapWithErrorBoundary(fn, options = {}) {
    const {
      context = "unknown",
      fallback = null,
      silent = false,
      retries = 0,
    } = options;

    return async (...args) => {
      let lastError;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;

          const errorData = {
            type: "wrapped_function",
            context,
            message: error.message,
            error,
            attempt: attempt + 1,
            maxRetries: retries + 1,
            args: this.sanitizeArgs(args),
            timestamp: new Date().toISOString(),
          };

          this.logError(errorData);

          // If not last attempt, wait before retry
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
            continue;
          }
        }
      }

      // All retries failed
      if (!silent) {
        this.showUserError(lastError, context);
      }

      return fallback;
    };
  }

  /**
   * Create error boundary for async operations
   * @param {Promise} promise - Promise to wrap
   * @param {object} options - Options
   * @returns {Promise} Wrapped promise
   */
  async boundary(promise, options = {}) {
    try {
      return await promise;
    } catch (error) {
      const errorData = {
        type: "async_boundary",
        context: options.context || "async_operation",
        message: error.message,
        error,
        timestamp: new Date().toISOString(),
      };

      this.logError(errorData);

      if (options.fallback !== undefined) {
        return options.fallback;
      }

      if (!options.silent) {
        this.showUserError(error, options.context);
      }

      throw error;
    }
  }

  /**
   * Safe execution of functions
   * @param {Function} fn - Function to execute safely
   * @param {object} options - Options
   * @returns {any} Result or fallback
   */
  safeExecute(fn, options = {}) {
    try {
      return fn();
    } catch (error) {
      this.logError({
        type: "safe_execute",
        context: options.context || "safe_execution",
        message: error.message,
        error,
        timestamp: new Date().toISOString(),
      });

      return options.fallback;
    }
  }

  /**
   * Show user-friendly error message
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  showUserError(error, context = "unknown") {
    const userMessage = this.getUserFriendlyMessage(error, context);

    // Try to show in UI if available
    if (typeof window.showNotification === "function") {
      window.showNotification(userMessage, "error");
    } else {
      // Fallback to alert or console
      console.error(`❌ ${userMessage}`);
    }
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(error, context) {
    const contextMessages = {
      account_switch: "Gagal beralih akun. Silakan coba lagi.",
      payment_card: "Terjadi kesalahan pada kartu pembayaran.",
      generator: "Generator kartu mengalami masalah.",
      storage: "Gagal menyimpan data. Periksa izin extension.",
      network: "Koneksi internet bermasalah. Coba lagi nanti.",
      permission: "Extension memerlukan izin tambahan.",
      unknown: "Terjadi kesalahan yang tidak diketahui.",
    };

    return contextMessages[context] || contextMessages["unknown"];
  }

  /**
   * Register error callback
   * @param {string} type - Error type to listen for
   * @param {Function} callback - Callback function
   */
  onError(type, callback) {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, []);
    }
    this.errorCallbacks.get(type).push(callback);
  }

  /**
   * Trigger error callbacks
   * @param {object} errorData - Error data
   */
  triggerErrorCallbacks(errorData) {
    // Type-specific callbacks
    const typeCallbacks = this.errorCallbacks.get(errorData.type) || [];
    typeCallbacks.forEach((callback) => {
      try {
        callback(errorData);
      } catch (error) {
        console.error("Error in error callback:", error);
      }
    });

    // General error callbacks
    const generalCallbacks = this.errorCallbacks.get("*") || [];
    generalCallbacks.forEach((callback) => {
      try {
        callback(errorData);
      } catch (error) {
        console.error("Error in general error callback:", error);
      }
    });
  }

  /**
   * Persist error to storage
   * @param {object} errorEntry - Error entry
   */
  async persistError(errorEntry) {
    try {
      const errors = await chrome.storage.local.get(["errorLog"]);
      const errorLog = errors.errorLog || [];

      errorLog.unshift(errorEntry);

      // Keep only last 50 errors in storage
      if (errorLog.length > 50) {
        errorLog.splice(50);
      }

      await chrome.storage.local.set({ errorLog });
    } catch (error) {
      console.error("Failed to persist error:", error);
    }
  }

  /**
   * Get error statistics
   * @returns {object} Error stats
   */
  getStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errorLog.filter(
      (error) => new Date(error.timestamp).getTime() > now - oneHour
    );

    const todayErrors = this.errorLog.filter(
      (error) => new Date(error.timestamp).getTime() > now - oneDay
    );

    const errorsByType = {};
    this.errorLog.forEach((error) => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      recentErrors: recentErrors.length,
      todayErrors: todayErrors.length,
      errorsByType,
      lastError: this.errorLog[0] || null,
    };
  }

  /**
   * Clear error log
   */
  clearErrors() {
    this.errorLog = [];
    chrome.storage.local.remove(["errorLog"]);
    console.log("🧹 Error log cleared");
  }

  /**
   * Export errors for debugging
   * @returns {string} JSON string of errors
   */
  exportErrors() {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Utility functions
   */
  sanitizeArgs(args) {
    return args.map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        return "[Object]";
      }
      if (typeof arg === "function") {
        return "[Function]";
      }
      return String(arg).substring(0, 100);
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global instance
window.errorHandler = new ErrorHandler();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ErrorHandler;
}

// Convenience functions
window.safeAsync = (fn, options) =>
  window.errorHandler.wrapWithErrorBoundary(fn, options);
window.safeBoundary = (promise, options) =>
  window.errorHandler.boundary(promise, options);
window.safeExecute = (fn, options) =>
  window.errorHandler.safeExecute(fn, options);
