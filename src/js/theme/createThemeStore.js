/**
 * Theme Store - Manages theme state, persistence, and operations
 */

/**
 * Creates a theme store with state management and persistence
 * 
 * @param {Object} defaultTheme - The default theme to use
 * @param {Array} presetThemes - Array of preset themes
 * @returns {Object} Theme store with methods for managing themes
 */
export function createThemeStore(defaultTheme, presetThemes = []) {
  // Internal state
  let currentTheme = { ...defaultTheme };
  let listeners = [];
  
  // Load theme from localStorage if available
  const loadSavedTheme = () => {
    try {
      const savedTheme = localStorage.getItem('translink-theme');
      if (savedTheme) {
        currentTheme = JSON.parse(savedTheme);
        applyTheme(currentTheme);
      } else {
        applyTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      applyTheme(defaultTheme);
    }
  };
  
  // Save current theme to localStorage
  const saveTheme = (theme) => {
    try {
      localStorage.setItem('translink-theme', JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  };
  
  // Apply theme to CSS variables and 3D scene
  const applyTheme = (theme) => {
    // Apply UI theme to CSS variables
    Object.entries(theme.ui).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
    
    // Notify listeners of theme change for 3D scene updates
    notifyListeners();
  };
  
  // Notify all listeners of theme changes
  const notifyListeners = () => {
    listeners.forEach(listener => listener(currentTheme));
  };
  
  // Initialize the theme
  loadSavedTheme();
  
  // Public API
  return {
    // Get the current theme
    getCurrentTheme: () => ({ ...currentTheme }),
    
    // Get all available themes (default + presets)
    getAvailableThemes: () => [
      { ...defaultTheme },
      ...presetThemes.map(theme => ({ ...theme }))
    ],
    
    // Set a complete theme
    setTheme: (theme) => {
      currentTheme = { ...theme };
      applyTheme(currentTheme);
      saveTheme(currentTheme);
    },
    
    // Update a specific color in the current theme
    updateColor: (path, colorKey, value) => {
      if (path === 'ui' || path === '3d') {
        currentTheme[path][colorKey] = value;
        applyTheme(currentTheme);
        saveTheme(currentTheme);
      }
    },
    
    // Reset to default theme
    resetToDefault: () => {
      currentTheme = { ...defaultTheme };
      applyTheme(currentTheme);
      saveTheme(currentTheme);
    },
    
    // Export current theme as JSON
    exportTheme: () => {
      const themeString = JSON.stringify(currentTheme, null, 2);
      const blob = new Blob([themeString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    
    // Import theme from JSON
    importTheme: (jsonString) => {
      try {
        const theme = JSON.parse(jsonString);
        
        // Validate theme structure
        if (!theme.name || !theme.version || !theme.ui || !theme['3d']) {
          throw new Error('Invalid theme format');
        }
        
        currentTheme = theme;
        applyTheme(currentTheme);
        saveTheme(currentTheme);
        return true;
      } catch (error) {
        console.error('Error importing theme:', error);
        return false;
      }
    },
    
    // Subscribe to theme changes
    subscribe: (callback) => {
      listeners.push(callback);
      // Return unsubscribe function
      return () => {
        listeners = listeners.filter(listener => listener !== callback);
      };
    },
    
    // Get 3D theme colors for scene updates
    get3DColors: () => ({ ...currentTheme['3d'] })
  };
} 