/**
 * ColorPicker Component
 * A reusable color picker component for the settings page
 */

export class ColorPicker {
  /**
   * Create a new ColorPicker instance
   * 
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for the color picker
   * @param {string} options.initialColor - Initial color value (hex)
   * @param {string} options.label - Label for the color picker
   * @param {Function} options.onChange - Callback function when color changes
   */
  constructor(options) {
    this.container = options.container;
    this.color = options.initialColor || '#ffffff';
    this.label = options.label || 'Color';
    this.onChange = options.onChange || (() => {});
    
    this.render();
    this.bindEvents();
  }
  
  /**
   * Render the color picker component
   */
  render() {
    // Create wrapper element
    this.element = document.createElement('div');
    this.element.className = 'color-picker';
    
    // Create label
    const labelElement = document.createElement('label');
    labelElement.className = 'color-picker__label';
    labelElement.textContent = this.label;
    
    // Create color preview
    this.preview = document.createElement('div');
    this.preview.className = 'color-picker__preview';
    this.preview.style.backgroundColor = this.color;
    
    // Create color input
    this.input = document.createElement('input');
    this.input.type = 'color';
    this.input.className = 'color-picker__input';
    this.input.value = this.color;
    
    // Create hex input
    this.hexInput = document.createElement('input');
    this.hexInput.type = 'text';
    this.hexInput.className = 'color-picker__hex';
    this.hexInput.value = this.color;
    this.hexInput.maxLength = 7;
    this.hexInput.placeholder = '#RRGGBB';
    
    // Assemble the component
    this.element.appendChild(labelElement);
    this.element.appendChild(this.preview);
    this.element.appendChild(this.input);
    this.element.appendChild(this.hexInput);
    
    // Add to container
    this.container.appendChild(this.element);
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    // Color input change
    this.input.addEventListener('input', (e) => {
      const newColor = e.target.value;
      this.updateColor(newColor);
    });
    
    // Hex input change
    this.hexInput.addEventListener('input', (e) => {
      let newColor = e.target.value;
      
      // Ensure it starts with #
      if (!newColor.startsWith('#')) {
        newColor = '#' + newColor;
        this.hexInput.value = newColor;
      }
      
      // Only update if it's a valid hex color
      if (/^#[0-9A-F]{6}$/i.test(newColor)) {
        this.updateColor(newColor);
      }
    });
    
    // Handle blur on hex input to fix invalid values
    this.hexInput.addEventListener('blur', () => {
      this.hexInput.value = this.color;
    });
  }
  
  /**
   * Update the color value and trigger onChange
   * 
   * @param {string} newColor - New color value (hex)
   */
  updateColor(newColor) {
    this.color = newColor;
    this.preview.style.backgroundColor = newColor;
    this.input.value = newColor;
    this.hexInput.value = newColor;
    this.onChange(newColor);
  }
  
  /**
   * Set the color programmatically
   * 
   * @param {string} color - New color value (hex)
   */
  setColor(color) {
    this.updateColor(color);
  }
  
  /**
   * Get the current color value
   * 
   * @returns {string} Current color value (hex)
   */
  getColor() {
    return this.color;
  }
  
  /**
   * Remove the color picker from the DOM
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
} 