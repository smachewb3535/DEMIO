/**
 * Error Boundary for handling JavaScript errors gracefully
 */

export class ErrorBoundary {
  constructor() {
    this.errors = [];
    this.setupGlobalErrorHandling();
  }

  setupGlobalErrorHandling() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'javascript'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason,
        type: 'promise'
      });
    });

    // Handle WebGL context loss
    const canvas = document.querySelector('[data-gl-canvas]');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.handleWebGLContextLoss();
      });

      canvas.addEventListener('webglcontextrestored', () => {
        this.handleWebGLContextRestored();
      });
    }
  }

  handleError(errorInfo) {
    console.error('ErrorBoundary caught error:', errorInfo);
    
    this.errors.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Show user-friendly error message
    this.showErrorMessage(errorInfo);

    // Report to analytics (if implemented)
    this.reportError(errorInfo);
  }

  handleWebGLContextLoss() {
    console.warn('WebGL context lost');
    this.showErrorMessage({
      message: 'Graphics context lost. The page will reload automatically.',
      type: 'webgl'
    });

    // Attempt to reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  handleWebGLContextRestored() {
    console.log('WebGL context restored');
    // Reinitialize WebGL if needed
    if (window.App && window.App.gl) {
      window.App.gl.init();
    }
  }

  showErrorMessage(errorInfo) {
    // Create or update error notification
    let errorNotification = document.getElementById('error-notification');
    
    if (!errorNotification) {
      errorNotification = document.createElement('div');
      errorNotification.id = 'error-notification';
      errorNotification.className = 'error-notification';
      document.body.appendChild(errorNotification);
    }

    const message = this.getErrorMessage(errorInfo);
    errorNotification.innerHTML = `
      <div class="error-notification__content">
        <div class="error-notification__icon">⚠️</div>
        <div class="error-notification__message">${message}</div>
        <button class="error-notification__close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (errorNotification.parentNode) {
        errorNotification.remove();
      }
    }, 10000);
  }

  getErrorMessage(errorInfo) {
    switch (errorInfo.type) {
      case 'webgl':
        return 'Graphics rendering issue detected. Reloading...';
      case 'promise':
        return 'A background process encountered an error. The application should continue to work normally.';
      case 'javascript':
      default:
        return 'An unexpected error occurred. Please refresh the page if issues persist.';
    }
  }

  reportError(errorInfo) {
    // Implement error reporting to your analytics service
    // Example: send to Sentry, LogRocket, or custom endpoint
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: false
      });
    }
  }

  getErrorHistory() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

// Initialize error boundary
export const errorBoundary = new ErrorBoundary();