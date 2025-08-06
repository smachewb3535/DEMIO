/**
 * Theme System - Main exports
 */

import themeStore from './ThemeStore';
import ThemeUpdater from './ThemeUpdater';

let themeUpdaterInstance = null;

/**
 * Initialize the theme system
 * This applies the current theme to the document and sets up the ThemeUpdater
 * 
 * @param {Object} gl - The WebGL instance
 */
export function initThemeSystem(gl) {
    console.log('Initializing theme system...', gl ? 'GL provided' : 'No GL instance yet');
    
    // Apply the current theme to the document
    const theme = themeStore.getCurrentTheme();
    applyThemeToDocument(theme);
    
    // Set up the theme updater if GL is available
    if (gl) {
        console.log('Setting up ThemeUpdater with GL instance');
        themeUpdaterInstance = new ThemeUpdater(gl, themeStore);
    } else {
        // Try to get GL instance from window.App
        setTimeout(() => {
            if (!themeUpdaterInstance && window.App && window.App.gl) {
                console.log('Setting up ThemeUpdater with App.gl');
                themeUpdaterInstance = new ThemeUpdater(window.App.gl, themeStore);
            }
        }, 1000);
        
        // Retry a few times to connect to GL
        let attempts = 0;
        const maxAttempts = 5;
        const checkInterval = setInterval(() => {
            attempts++;
            if (themeUpdaterInstance) {
                clearInterval(checkInterval);
                return;
            }
            
            if (window.App && window.App.gl) {
                console.log('Setting up ThemeUpdater with App.gl (attempt ' + attempts + ')');
                themeUpdaterInstance = new ThemeUpdater(window.App.gl, themeStore);
                clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
                console.warn('Failed to connect ThemeUpdater to GL after ' + maxAttempts + ' attempts');
                clearInterval(checkInterval);
            }
        }, 1000);
    }
    
    // Subscribe to theme changes
    themeStore.subscribe((theme) => {
        console.log('Theme changed, applying to document');
        applyThemeToDocument(theme);
    });
    
    // Log that theme system is initialized
    console.log('Theme system initialized with theme:', theme.name);
    
    // Return the theme updater for potential direct access
    return themeUpdaterInstance;
}

/**
 * Apply a theme to the document by setting CSS variables
 * 
 * @param {Object} theme - The theme to apply
 */
function applyThemeToDocument(theme) {
    if (!theme || !theme.ui) {
        console.error('Invalid theme object:', theme);
        return;
    }
    
    console.log('Applying theme to document:', theme.name);
    
    // Apply UI colors as CSS variables
    Object.entries(theme.ui).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply 3D colors as CSS variables (for potential use in UI)
    Object.entries(theme['3d']).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--color-3d-${key}`, value);
    });
}

/**
 * Get the current ThemeUpdater instance
 * 
 * @returns {ThemeUpdater|null} The current ThemeUpdater instance or null if not initialized
 */
export function getThemeUpdater() {
    return themeUpdaterInstance;
}

/**
 * Connect the ThemeUpdater to a GL instance
 * 
 * @param {Object} gl - The WebGL instance
 */
export function connectThemeUpdaterToGL(gl) {
    if (!gl) {
        console.error('Cannot connect ThemeUpdater to null GL instance');
        return;
    }
    
    if (themeUpdaterInstance) {
        console.log('ThemeUpdater already exists, reconnecting to new GL instance');
        themeUpdaterInstance.setGL(gl);
    } else {
        console.log('Creating new ThemeUpdater with GL instance');
        themeUpdaterInstance = new ThemeUpdater(gl, themeStore);
    }
    
    return themeUpdaterInstance;
}

// Export the theme store for direct access
export { themeStore };

// Export theme updater for 3D scene
export { default as ThemeUpdater } from './ThemeUpdater';

// Export UI components
export { ColorPicker } from './ColorPicker';
export { default as SettingsPage } from './SettingsPage'; 