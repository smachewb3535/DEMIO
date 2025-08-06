import WebGL from 'three/addons/capabilities/WebGL.js'

import {
    Pages
} from './pages'
import {
    Scroll
} from './scroll'
import {
    Resize
} from './utils/subscribable'
import {
    Raf
} from './utils/subscribable'
import {
    Dom
} from './dom'

import Hey from './utils/hey'
import Gl from './gl/Gl'
import ScrollController from './modules/ScrollController'
import Loader from './modules/loader'
import { initThemeSystem, connectThemeUpdaterToGL } from './theme'
import { errorBoundary } from './utils/ErrorBoundary'
import { performanceMonitor } from './utils/PerformanceMonitor'
import { accessibilityManager } from './utils/AccessibilityManager'
import { lazyLoader } from './utils/LazyLoader'

/** you might want to activate it only towards the end of the project? */
history.scrollRestoration = 'manual'

// Create a global App object
window.App = window.App || {};

export class App {
    /* 
      Root
    */
    static {
        if (WebGL.isWebGL2Available()) {
            this.initWebGLVersion()
        } else {
            this.initFallback()
        }
    }

    /* 
      Functions
    */
    static async initWebGLVersion() {
        this.urlParams = new URLSearchParams(window.location.search)
        this.isDebug = this.urlParams.has('debug')

        // Initialize error handling and performance monitoring
        console.log('App: Initializing error handling and performance monitoring...')
        
        // Preload critical modules
        try {
            await lazyLoader.preloadCriticalModules()
        } catch (error) {
            console.warn('Failed to preload critical modules:', error)
        }
        /* 
          Promises Init
        */
        this.promises = []

        /* 
        [ - - - - - - - - - - - - ]
        Init classes
        [ - - - - - - - - - - - - ]
        */

        this.setLoadedClasses()

        // Initialize theme system first
        initThemeSystem(null);
        
        // Add accessibility skip link
        accessibilityManager.addSkipLink();
        
        // Check if we're on the settings page
        const path = window.location.pathname;
        const isSettingsPage = path === '/settings' || path.endsWith('/settings');
        
        // If we're on the settings page, bypass the loader and directly show settings
        if (isSettingsPage) {
            console.log('Settings page detected, bypassing loader');
            
            // Hide loader if it exists
            const loader = document.querySelector('.loader-w');
            if (loader) {
                loader.style.display = 'none';
            }
            
            // Hide main content
            const mainWrapper = document.querySelector('.main-wrapper');
            if (mainWrapper) {
                mainWrapper.style.display = 'none';
            }
            
            // Initialize GL minimally for theme system
            this.gl = new Gl({
                canvas: '[data-gl-canvas]',
            });
            
            // Load GL but don't wait for animation
            this.gl.load().then(() => {
                // Make GL instance available globally for theme updater
                window.App.gl = this.gl;
                
                // Initialize theme system with GL instance
                connectThemeUpdaterToGL(this.gl);
                
                // Initialize minimal scene
                this.gl.init('homepage');
            });
            
            // Initialize settings page immediately
            this.initSettingsPage();
            
            // Everything is ready
            document.documentElement.classList.add('is-ready');
            
            return;
        }

        // For non-settings pages, continue with normal initialization
        // Initialize loader
        this.loader = new Loader(Hey.PAGE_SLUG)

        // Start loader animations
        this.loaderPromise = this.loader.loaderAnimation(Hey.PAGE_SLUG)

        // GL
        this.gl = new Gl({
            canvas: '[data-gl-canvas]',
        })
        this.promises.push(this.gl.load())

        /* 
        [▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░]
        Await WebGL loading
        [▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░]
        */
        await Promise.all(this.promises)

        /* 
        [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%]
        WebGL is loaded, now trigger loader outro and wait for it to complete
        [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%]
        */
        // Now that WebGL is ready, trigger the loader outro and wait for it to complete
        await this.loader.animationOutro(Hey.PAGE_SLUG)

        // Outro is complete, init gl
        ScrollController.init()

        // Make GL instance available globally for theme updater
        window.App.gl = this.gl;
        
        // Connect performance monitoring to GL
        if (performanceMonitor) {
            performanceMonitor.gl = this.gl;
        }
        
        // Initialize theme system with GL instance
        connectThemeUpdaterToGL(this.gl);

        // Handle regular pages
        switch (Hey.PAGE_SLUG) {
            case '/':
                this.gl.init('homepage')
                break
            case '/preorder':
                this.gl.init('easter-egg')
                break
            case '/specs':
                this.gl.init('specs')
                break
            case '/fwa':
                this.gl.init('fwa')
                break
            default:
                // Default to homepage for unknown routes
                this.gl.init('homepage')
                break
        }

        // Everything is ready
        document.documentElement.classList.add('is-ready')
        
        // Set up navigation handler for settings page
        this.setupSettingsNavigation();
    }

    static initFallback() {
        console.log('WebGL not supported, initializing fallback mode')
        
        // Show fallback message to user
        const fallbackMessage = document.createElement('div')
        fallbackMessage.className = 'webgl-fallback'
        fallbackMessage.innerHTML = `
            <div class="webgl-fallback__content">
                <h2>WebGL Not Supported</h2>
                <p>Your browser doesn't support WebGL, which is required for the 3D experience.</p>
                <p>Please try updating your browser or using a different one.</p>
                <a href="https://get.webgl.org/" target="_blank" rel="noopener">Learn more about WebGL</a>
            </div>
        `
        
        // Add fallback styles
        const style = document.createElement('style')
        style.textContent = `
            .webgl-fallback {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--color-background, #050D15);
                color: var(--color-text, #ffffff);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .webgl-fallback__content {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
            }
            
            .webgl-fallback__content h2 {
                margin-bottom: 1rem;
                font-size: 2rem;
            }
            
            .webgl-fallback__content p {
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .webgl-fallback__content a {
                color: var(--color-accent, #41a5ff);
                text-decoration: underline;
            }
        `
        
        document.head.appendChild(style)
        document.body.appendChild(fallbackMessage)
        
        // Initialize basic functionality without WebGL
        this.setLoadedClasses()
        document.documentElement.classList.add('is-ready')
    }

    static setLoadedClasses() {
        document.documentElement.classList.add('is-loaded')
    }

    static initSettingsPage() {
        console.log('Initializing settings page...');
        
        // Remove any existing settings container to avoid duplicates
        const existingContainer = document.getElementById('settings-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Hide loader if it exists
        const loader = document.querySelector('.loader-w');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Hide main content
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
            mainWrapper.style.display = 'none';
        }
        
        // Create container for settings page
        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'settings-container';
        settingsContainer.className = 'settings-container';
        document.body.appendChild(settingsContainer);
        
        // Make sure the container is visible
        settingsContainer.style.display = 'block';
        settingsContainer.style.opacity = '1';
        
        // Add immediate loading indicator
        settingsContainer.innerHTML = `
            <div class="settings-loading">
                <h1>Loading Theme Settings...</h1>
                <div class="settings-loading-spinner"></div>
            </div>
        `;
        
        // Add loading spinner style
        if (!document.getElementById('settings-loading-style')) {
            const style = document.createElement('style');
            style.id = 'settings-loading-style';
            style.textContent = `
                .settings-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    color: var(--color-text, #ffffff);
                }
                
                .settings-loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: var(--color-accent, #41a5ff);
                    animation: spin 1s ease-in-out infinite;
                    margin-top: 20px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Import settings page dynamically
        import('./theme/SettingsPage').then(module => {
            const SettingsPage = module.default;
            
            // Initialize settings page
            const settingsPage = new SettingsPage(settingsContainer);
            console.log('Settings page initialized:', settingsPage);
            
            // Make sure document is ready
            document.documentElement.classList.add('is-loaded');
            document.documentElement.classList.add('is-ready');
        }).catch(error => {
            console.error('Error loading settings page:', error);
            settingsContainer.innerHTML = `
                <div class="settings-error">
                    <h1>Error Loading Settings</h1>
                    <p>${error.message}</p>
                </div>
            `;
        });
    }
    
    static setupSettingsNavigation() {
        // Add a navigation link to the settings page if it doesn't exist
        const nav = document.querySelector('.nav__list');
        if (nav && !nav.querySelector('a[href="/settings"]')) {
            const settingsItem = document.createElement('li');
            settingsItem.className = 'nav__item';
            
            const settingsLink = document.createElement('a');
            settingsLink.href = '/settings';
            settingsLink.className = 'nav__link';
            settingsLink.textContent = 'Theme Settings';
            
            settingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.initSettingsPage();
                history.pushState({}, '', '/settings');
            });
            
            settingsItem.appendChild(settingsLink);
            nav.appendChild(settingsItem);
        }
    }
}

// Add a direct navigation handler for the settings page
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path === '/settings' || path.endsWith('/settings')) {
        App.initSettingsPage();
    }
    
    // Add settings link to navigation
    App.setupSettingsNavigation();
});

// Add a direct route handler for the settings page
const handleRouteChange = () => {
    const path = window.location.pathname;
    if (path === '/settings' || path.endsWith('/settings')) {
        App.initSettingsPage();
    }
};

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', handleRouteChange);

// Create a settings button in the corner for easy access
document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.createElement('div');
    settingsButton.className = 'settings-quick-access';
    settingsButton.innerHTML = `
        <a href="/settings" title="Theme Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        </a>
    `;
    
    // Add styles for the quick access button
    const style = document.createElement('style');
    style.textContent = `
        .settings-quick-access {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s, background-color 0.2s;
        }
        
        .settings-quick-access:hover {
            transform: scale(1.1);
            background: rgba(0, 0, 0, 0.8);
        }
        
        .settings-quick-access a {
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(settingsButton);
    
    // Add click handler
    settingsButton.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        App.initSettingsPage();
        history.pushState({}, '', '/settings');
    });
});

setTimeout(() => {
    // ------------------------------ welcome message
    const baseStyle = 'background-color: #FDFDF5; color: black; font: 400 1em monospace; padding: 0.5em 0;'
    const boldStyle = 'background-color: #FDFDF5; color: black; font: 400 1em monospace; padding: 0.5em 0; font-weight: bold;'

    // Log the styled message to the console
    console.log('%c built by OFF+BRAND. %c > Local Development', boldStyle, '')
}, 500)