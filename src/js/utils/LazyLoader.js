/**
 * Lazy Loader - Implements lazy loading for assets and modules
 */

export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.intersectionObserver = null;
    
    this.init();
  }

  init() {
    // Set up intersection observer for lazy loading
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadElementAssets(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observe elements with lazy loading attributes
    this.observeLazyElements();
  }

  observeLazyElements() {
    // Observe images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.intersectionObserver.observe(img);
    });

    // Observe elements with data-lazy-module
    document.querySelectorAll('[data-lazy-module]').forEach(el => {
      this.intersectionObserver.observe(el);
    });
  }

  async loadElementAssets(element) {
    // Stop observing this element
    this.intersectionObserver.unobserve(element);

    // Load image if it has data-src
    if (element.hasAttribute('data-src')) {
      await this.loadImage(element);
    }

    // Load module if it has data-lazy-module
    if (element.hasAttribute('data-lazy-module')) {
      await this.loadModule(element.getAttribute('data-lazy-module'), element);
    }
  }

  loadImage(img) {
    return new Promise((resolve, reject) => {
      const src = img.getAttribute('data-src');
      if (!src) {
        resolve();
        return;
      }

      const image = new Image();
      image.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        resolve();
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  async loadModule(moduleName, element) {
    // Check if module is already loaded
    if (this.loadedModules.has(moduleName)) {
      const ModuleClass = this.loadedModules.get(moduleName);
      return new ModuleClass(element);
    }

    // Check if module is currently loading
    if (this.loadingPromises.has(moduleName)) {
      const ModuleClass = await this.loadingPromises.get(moduleName);
      return new ModuleClass(element);
    }

    // Load module dynamically
    const loadingPromise = this.dynamicImport(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const ModuleClass = await loadingPromise;
      this.loadedModules.set(moduleName, ModuleClass);
      this.loadingPromises.delete(moduleName);
      
      return new ModuleClass(element);
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }

  async dynamicImport(moduleName) {
    // Map module names to their file paths
    const moduleMap = {
      'accordion': () => import('../modules/Accordion.js'),
      'audio-toggler': () => import('../modules/AudioToggler.js'),
      'cursor': () => import('../modules/Cursor.js'),
      'modal': () => import('../modules/Modal.js'),
      'menu': () => import('../modules/menu.js'),
      'scramble': () => import('../modules/scramble.js'),
      'shapes': () => import('../modules/shapes.js'),
      'text': () => import('../modules/text.js'),
      'parallax': () => import('../modules/Parallax.js'),
      'outline': () => import('../modules/Outline.js')
    };

    if (!moduleMap[moduleName]) {
      throw new Error(`Module ${moduleName} not found in module map`);
    }

    const module = await moduleMap[moduleName]();
    
    // Return the default export or the first named export
    return module.default || Object.values(module)[0];
  }

  // Preload critical modules
  async preloadCriticalModules() {
    const criticalModules = ['menu', 'cursor', 'audio-toggler'];
    
    const preloadPromises = criticalModules.map(moduleName => 
      this.loadModule(moduleName, document.createElement('div'))
        .catch(error => console.warn(`Failed to preload ${moduleName}:`, error))
    );

    await Promise.allSettled(preloadPromises);
  }

  // Lazy load 3D assets
  async load3DAssets() {
    if (this.loadingPromises.has('3d-assets')) {
      return this.loadingPromises.get('3d-assets');
    }

    const loadingPromise = this.load3DAssetsInternal();
    this.loadingPromises.set('3d-assets', loadingPromise);
    
    return loadingPromise;
  }

  async load3DAssetsInternal() {
    // Load 3D assets only when needed
    const assets = [
      '/assets/models/scene-258.glb',
      '/assets/textures/noise-r.png',
      '/assets/textures/matcap-glass-01.png'
    ];

    const loadPromises = assets.map(asset => {
      return new Promise((resolve, reject) => {
        const loader = asset.endsWith('.glb') ? 
          new THREE.GLTFLoader() : 
          new THREE.TextureLoader();
        
        loader.load(asset, resolve, undefined, reject);
      });
    });

    return Promise.all(loadPromises);
  }

  dispose() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}

// Initialize lazy loader
export const lazyLoader = new LazyLoader();