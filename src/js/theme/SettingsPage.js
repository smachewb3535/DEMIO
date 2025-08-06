import { ColorPicker } from './ColorPicker';
import themeStore from './ThemeStore';
import ThemeUpdater from './ThemeUpdater';

/**
 * SettingsPage - Manages the theme settings interface
 */
export class SettingsPage {
  /**
   * Create a new SettingsPage instance
   * 
   * @param {HTMLElement} container - Container element for the settings page
   */
  constructor(container) {
    console.log('SettingsPage constructor called with container:', container);
    
    if (!container) {
      console.error('SettingsPage: Container element is missing');
      return;
    }
    
    // Add settings-active class to body
    document.body.classList.add('settings-active');
    
    this.container = container;
    
    try {
      this.currentTheme = themeStore.getCurrentTheme();
      console.log('Current theme loaded:', this.currentTheme);
      
      this.availableThemes = themeStore.getAvailableThemes();
      console.log('Available themes loaded:', this.availableThemes.length);
      
      this.colorPickers = {
        ui: {},
        '3d': {}
      };
      
      this.render();
      this.bindEvents();
      
      console.log('SettingsPage initialized successfully');
    } catch (error) {
      console.error('Error initializing SettingsPage:', error);
      this.renderError(error);
    }
  }
  
  /**
   * Render the settings page
   */
  render() {
    console.log('Rendering settings page...');
    this.container.innerHTML = '';
    
    // Create page structure
    this.element = document.createElement('div');
    this.element.className = 'settings-page';
    
    // Create back button
    this.createBackButton();
    
    // Create header
    const header = document.createElement('div');
    header.className = 'settings-page__header';
    
    const title = document.createElement('h1');
    title.className = 'settings-page__title';
    title.textContent = 'Theme Settings';
    
    header.appendChild(title);
    this.element.appendChild(header);
    
    // Create preset themes section
    this.createPresetSection();
    
    // Create UI colors section
    this.createColorSection('UI Colors', 'ui');
    
    // Create 3D colors section
    this.createColorSection('3D Scene Colors', '3d');
    
    // Create actions section
    this.createActionsSection();
    
    // Add to container
    this.container.appendChild(this.element);
    
    // Add styles
    this.addStyles();
    
    console.log('Settings page rendered');
  }
  
  /**
   * Create back button to return to main site
   */
  createBackButton() {
    const backButton = document.createElement('button');
    backButton.className = 'settings-back-button';
    backButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5"></path>
        <path d="M12 19l-7-7 7-7"></path>
      </svg>
      Back to Site
    `;
    
    backButton.addEventListener('click', () => {
      this.closeSettings();
    });
    
    this.container.appendChild(backButton);
  }
  
  /**
   * Close settings and return to main site
   */
  closeSettings() {
    // Remove settings-active class from body
    document.body.classList.remove('settings-active');
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      mainWrapper.style.display = '';
    }
    
    // Show canvas
    const canvas = document.querySelector('.canvas-w');
    if (canvas) {
      canvas.style.display = '';
    }
    
    // Remove settings container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Update URL
    if (window.location.pathname.includes('/settings')) {
      history.pushState({}, '', '/');
    }
  }
  
  /**
   * Render an error message
   * 
   * @param {Error} error - The error that occurred
   */
  renderError(error) {
    console.error('Rendering error message:', error);
    
    this.container.innerHTML = `
      <div class="settings-page settings-error">
        <div class="settings-page__header">
          <h1 class="settings-page__title">Error Loading Theme Settings</h1>
        </div>
        <div class="settings-error-message">
          <p>An error occurred while loading the theme settings:</p>
          <pre>${error.message}</pre>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Create preset themes section
   */
  createPresetSection() {
    console.log('Creating preset themes section');
    
    const section = document.createElement('div');
    section.className = 'settings-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'settings-section__title';
    sectionTitle.textContent = 'Preset Themes';
    
    const presetContainer = document.createElement('div');
    presetContainer.className = 'preset-themes';
    
    // Add preset theme buttons
    this.availableThemes.forEach(theme => {
      const presetButton = document.createElement('button');
      presetButton.className = 'preset-theme-button';
      presetButton.dataset.themeName = theme.name;
      presetButton.textContent = theme.name;
      
      // Add color preview
      const colorPreview = document.createElement('div');
      colorPreview.className = 'preset-theme-preview';
      colorPreview.style.backgroundColor = theme['3d'].sceneBackground;
      colorPreview.style.border = `2px solid ${theme.ui.accent}`;
      
      presetButton.appendChild(colorPreview);
      presetContainer.appendChild(presetButton);
    });
    
    section.appendChild(sectionTitle);
    section.appendChild(presetContainer);
    this.element.appendChild(section);
  }
  
  /**
   * Create color section for UI or 3D colors
   * 
   * @param {string} title - Section title
   * @param {string} type - Section type ('ui' or '3d')
   */
  createColorSection(title, type) {
    console.log(`Creating ${type} colors section`);
    
    const section = document.createElement('div');
    section.className = 'settings-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'settings-section__title';
    sectionTitle.textContent = title;
    
    const colorContainer = document.createElement('div');
    colorContainer.className = 'color-pickers';
    
    // Add color pickers for each color in the theme
    Object.entries(this.currentTheme[type]).forEach(([colorKey, colorValue]) => {
      // Create container for this color picker
      const pickerContainer = document.createElement('div');
      pickerContainer.className = 'color-picker-container';
      
      // Format label from camelCase to Title Case
      const label = colorKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      try {
        // Create color picker
        const colorPicker = new ColorPicker({
          container: pickerContainer,
          initialColor: colorValue,
          label,
          onChange: (newColor) => {
            this.handleColorChange(type, colorKey, newColor);
          }
        });
        
        // Store reference to color picker
        this.colorPickers[type][colorKey] = colorPicker;
        
        colorContainer.appendChild(pickerContainer);
      } catch (error) {
        console.error(`Error creating color picker for ${colorKey}:`, error);
        
        // Create a fallback color input
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'color-picker';
        
        const fallbackLabel = document.createElement('label');
        fallbackLabel.className = 'color-picker__label';
        fallbackLabel.textContent = label;
        
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'color';
        fallbackInput.className = 'color-picker__input';
        fallbackInput.value = colorValue;
        fallbackInput.addEventListener('change', (e) => {
          this.handleColorChange(type, colorKey, e.target.value);
        });
        
        fallbackContainer.appendChild(fallbackLabel);
        fallbackContainer.appendChild(fallbackInput);
        pickerContainer.appendChild(fallbackContainer);
        colorContainer.appendChild(pickerContainer);
      }
    });
    
    section.appendChild(sectionTitle);
    section.appendChild(colorContainer);
    this.element.appendChild(section);
  }
  
  /**
   * Create actions section (import/export/reset)
   */
  createActionsSection() {
    console.log('Creating actions section');
    
    const section = document.createElement('div');
    section.className = 'settings-section settings-actions';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'settings-section__title';
    sectionTitle.textContent = 'Theme Actions';
    
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'settings-actions__container';
    
    // Export button
    this.exportButton = document.createElement('button');
    this.exportButton.className = 'settings-action-button';
    this.exportButton.textContent = 'Export Theme';
    actionsContainer.appendChild(this.exportButton);
    
    // Import button and file input
    this.importButton = document.createElement('button');
    this.importButton.className = 'settings-action-button';
    this.importButton.textContent = 'Import Theme';
    actionsContainer.appendChild(this.importButton);
    
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    actionsContainer.appendChild(this.fileInput);
    
    // Reset button
    this.resetButton = document.createElement('button');
    this.resetButton.className = 'settings-action-button settings-action-button--warning';
    this.resetButton.textContent = 'Reset to Default';
    actionsContainer.appendChild(this.resetButton);
    
    section.appendChild(sectionTitle);
    section.appendChild(actionsContainer);
    this.element.appendChild(section);
  }
  
  /**
   * Add styles for the settings page
   */
  addStyles() {
    if (document.getElementById('settings-page-styles')) {
      console.log('Settings page styles already exist');
      return;
    }
    
    console.log('Adding settings page styles');
    
    const style = document.createElement('style');
    style.id = 'settings-page-styles';
    style.textContent = `
      .settings-page {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: var(--color-text);
      }
      
      .settings-page__header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .settings-page__title {
        font-size: 2.5rem;
        margin: 0;
      }
      
      .settings-section {
        margin-bottom: 3rem;
      }
      
      .settings-section__title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      .preset-themes {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .preset-theme-button {
        background: var(--color-menuBackground);
        color: var(--color-text);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: background-color 0.3s;
      }
      
      .preset-theme-button:hover {
        background: var(--color-menuBorder);
      }
      
      .preset-theme-preview {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
      }
      
      .color-pickers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
      }
      
      .color-picker {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .color-picker__label {
        font-size: 0.9rem;
        opacity: 0.8;
      }
      
      .color-picker__preview {
        width: 100%;
        height: 2rem;
        border-radius: 0.25rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .color-picker__input {
        width: 3rem;
        height: 2rem;
        padding: 0;
        border: none;
        cursor: pointer;
      }
      
      .color-picker__hex {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.25rem;
        padding: 0.5rem;
        color: var(--color-text);
        font-family: monospace;
      }
      
      .settings-actions__container {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      
      .settings-action-button {
        background: var(--color-buttonBackground);
        color: var(--color-buttonText);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .settings-action-button:hover {
        background: var(--color-buttonHover);
      }
      
      .settings-action-button--warning {
        background: #7f1d1d;
      }
      
      .settings-action-button--warning:hover {
        background: #991b1b;
      }
      
      .settings-error {
        background-color: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
        border-radius: 0.5rem;
        padding: 2rem;
        margin-top: 2rem;
      }
      
      .settings-error-message {
        margin-top: 1rem;
      }
      
      .settings-error-message pre {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        border-radius: 0.25rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    console.log('Binding event listeners');
    
    // Preset theme buttons
    const presetButtons = this.element.querySelectorAll('.preset-theme-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const themeName = button.dataset.themeName;
        console.log(`Preset theme selected: ${themeName}`);
        
        const theme = this.availableThemes.find(t => t.name === themeName);
        if (theme) {
          this.applyTheme(theme);
        }
      });
    });
    
    // Export button
    this.exportButton.addEventListener('click', () => {
      console.log('Export theme clicked');
      themeStore.exportTheme();
    });
    
    // Import button
    this.importButton.addEventListener('click', () => {
      console.log('Import theme clicked');
      this.fileInput.click();
    });
    
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      console.log(`File selected: ${file.name}`);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const success = themeStore.importTheme(event.target.result);
          if (success) {
            console.log('Theme imported successfully');
            this.currentTheme = themeStore.getCurrentTheme();
            this.updateColorPickers();
          } else {
            console.error('Invalid theme file');
            alert('Invalid theme file');
          }
        } catch (error) {
          console.error('Error importing theme:', error);
          alert(`Error importing theme: ${error.message}`);
        }
      };
      reader.readAsText(file);
      
      // Reset file input
      this.fileInput.value = '';
    });
    
    // Reset button
    this.resetButton.addEventListener('click', () => {
      console.log('Reset theme clicked');
      if (confirm('Are you sure you want to reset to the default theme?')) {
        themeStore.resetToDefault();
        this.currentTheme = themeStore.getCurrentTheme();
        this.updateColorPickers();
      }
    });
  }
  
  /**
   * Handle color change from color picker
   * 
   * @param {string} type - Color type ('ui' or '3d')
   * @param {string} colorKey - Color key
   * @param {string} newColor - New color value
   */
  handleColorChange(type, colorKey, newColor) {
    console.log(`Color changed: ${type}.${colorKey} = ${newColor}`);
    themeStore.updateColor(type, colorKey, newColor);
    this.currentTheme = themeStore.getCurrentTheme();
  }
  
  /**
   * Apply a theme
   * 
   * @param {Object} theme - Theme to apply
   */
  applyTheme(theme) {
    console.log(`Applying theme: ${theme.name}`);
    themeStore.setTheme(theme);
    this.currentTheme = themeStore.getCurrentTheme();
    this.updateColorPickers();
  }
  
  /**
   * Update all color pickers with current theme values
   */
  updateColorPickers() {
    console.log('Updating color pickers');
    
    // Update UI color pickers
    Object.entries(this.colorPickers.ui).forEach(([colorKey, picker]) => {
      picker.setColor(this.currentTheme.ui[colorKey]);
    });
    
    // Update 3D color pickers
    Object.entries(this.colorPickers['3d']).forEach(([colorKey, picker]) => {
      picker.setColor(this.currentTheme['3d'][colorKey]);
    });
  }
}

export default SettingsPage; 