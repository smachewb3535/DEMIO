/**
 * Performance Monitor - Tracks and optimizes application performance
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      drawCalls: 0,
      triangles: 0,
      loadTime: 0
    };
    
    this.observers = [];
    this.isMonitoring = false;
    
    this.init();
  }

  init() {
    // Track page load performance
    this.trackLoadPerformance();
    
    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Monitor WebGL performance
    this.setupWebGLMonitoring();
    
    // Start monitoring
    this.startMonitoring();
  }

  trackLoadPerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
          console.log(`Page load time: ${this.metrics.loadTime.toFixed(2)}ms`);
        }
      });
    }
  }

  setupPerformanceObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  setupWebGLMonitoring() {
    // Monitor WebGL context
    if (window.App && window.App.gl) {
      const gl = window.App.gl;
      
      // Override renderer info to track draw calls
      if (gl.renderer && gl.renderer.instance) {
        const originalRender = gl.renderer.instance.render.bind(gl.renderer.instance);
        gl.renderer.instance.render = (...args) => {
          this.metrics.drawCalls++;
          return originalRender(...args);
        };
      }
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  updateMetrics() {
    // Update FPS (approximate)
    this.metrics.fps = this.calculateFPS();
    
    // Update memory usage
    if ('memory' in performance) {
      this.metrics.memory = performance.memory.usedJSHeapSize / 1048576; // MB
    }
    
    // Reset draw calls counter
    this.metrics.drawCalls = 0;
    
    // Check for performance issues
    this.checkPerformanceThresholds();
  }

  calculateFPS() {
    // Simple FPS calculation based on requestAnimationFrame
    if (!this.lastFrameTime) {
      this.lastFrameTime = performance.now();
      return 60;
    }
    
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    return Math.round(1000 / delta);
  }

  checkPerformanceThresholds() {
    const warnings = [];
    
    if (this.metrics.fps < 30) {
      warnings.push('Low FPS detected');
    }
    
    if (this.metrics.memory > 100) {
      warnings.push('High memory usage detected');
    }
    
    if (this.metrics.drawCalls > 1000) {
      warnings.push('High draw call count');
    }
    
    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings);
      this.optimizePerformance();
    }
  }

  optimizePerformance() {
    // Implement performance optimizations
    if (window.App && window.App.gl) {
      const gl = window.App.gl;
      
      // Reduce particle count if performance is poor
      if (gl.world && gl.world.scenes) {
        Object.values(gl.world.scenes).forEach(scene => {
          if (scene.particles && this.metrics.fps < 30) {
            scene.particles.settings.textCount = Math.max(8, scene.particles.settings.textCount * 0.8);
          }
        });
      }
    }
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  dispose() {
    this.stopMonitoring();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitor
export const performanceMonitor = new PerformanceMonitor();