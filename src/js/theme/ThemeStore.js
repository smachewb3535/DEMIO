import { createThemeStore } from './createThemeStore';

// Default theme with all color variables
export const defaultTheme = {
  name: "Default",
  version: "1.0",
  ui: {
    // Base colors
    background: "#050D15",
    text: "#ffffff",
    brand: "#050D15",
    lightBlue: "#EEF6FF",
    
    // UI Components
    menuBackground: "#7f1d1d",
    menuBorder: "#991b1b",
    menuText: "#ffffff",
    
    // Button colors
    buttonBackground: "#7f1d1d",
    buttonHover: "#991b1b",
    buttonText: "#ffffff",
    
    // Form elements
    inputBackground: "#7f1d1d",
    inputBorder: "#991b1b",
    inputText: "#ffffff",
    inputPlaceholder: "#fca5a5",
    
    // Accents and highlights
    accent: "#41a5ff",
    accentLight: "#abd7ff",
    highlight: "#8affff",
  },
  "3d": {
    // 3D scene colors
    sceneBackground: "#133153",
    fresnelColor: "#60b2ff",
    envColor: "#182d3d",
    coreColor: "#bec0fe",
    tubeColor: "#b2e0ff",
    touchpadBaseColor: "#b4dee7",
    touchpadCornersColor: "#8bccda",
    touchpadVisualizerColor: "#60b2ff",
  }
};

// Dark theme preset
export const darkTheme = {
  name: "Dark",
  version: "1.0",
  ui: {
    background: "#000000",
    text: "#ffffff",
    brand: "#000000",
    lightBlue: "#1a1a2e",
    
    menuBackground: "#1a1a2e",
    menuBorder: "#252547",
    menuText: "#ffffff",
    
    buttonBackground: "#252547",
    buttonHover: "#3a3a6a",
    buttonText: "#ffffff",
    
    inputBackground: "#1a1a2e",
    inputBorder: "#252547",
    inputText: "#ffffff",
    inputPlaceholder: "#6e6e9c",
    
    accent: "#4361ee",
    accentLight: "#4895ef",
    highlight: "#4cc9f0",
  },
  "3d": {
    sceneBackground: "#000000",
    fresnelColor: "#4361ee",
    envColor: "#0a0a1c",
    coreColor: "#4cc9f0",
    tubeColor: "#4895ef",
    touchpadBaseColor: "#4361ee",
    touchpadCornersColor: "#3a0ca3",
    touchpadVisualizerColor: "#4cc9f0",
  }
};

// Light theme preset
export const lightTheme = {
  name: "Light",
  version: "1.0",
  ui: {
    background: "#ffffff",
    text: "#1a1a2e",
    brand: "#f8f9fa",
    lightBlue: "#e9ecef",
    
    menuBackground: "#f8f9fa",
    menuBorder: "#dee2e6",
    menuText: "#212529",
    
    buttonBackground: "#4361ee",
    buttonHover: "#3a0ca3",
    buttonText: "#ffffff",
    
    inputBackground: "#f8f9fa",
    inputBorder: "#dee2e6",
    inputText: "#212529",
    inputPlaceholder: "#adb5bd",
    
    accent: "#4361ee",
    accentLight: "#4895ef",
    highlight: "#4cc9f0",
  },
  "3d": {
    sceneBackground: "#e9ecef",
    fresnelColor: "#4361ee",
    envColor: "#dee2e6",
    coreColor: "#4cc9f0",
    tubeColor: "#4895ef",
    touchpadBaseColor: "#4361ee",
    touchpadCornersColor: "#3a0ca3",
    touchpadVisualizerColor: "#4cc9f0",
  }
};

// Neon theme preset
export const neonTheme = {
  name: "Neon",
  version: "1.0",
  ui: {
    background: "#10002b",
    text: "#e0aaff",
    brand: "#240046",
    lightBlue: "#3c096c",
    
    menuBackground: "#240046",
    menuBorder: "#3c096c",
    menuText: "#e0aaff",
    
    buttonBackground: "#5a189a",
    buttonHover: "#7b2cbf",
    buttonText: "#e0aaff",
    
    inputBackground: "#240046",
    inputBorder: "#3c096c",
    inputText: "#e0aaff",
    inputPlaceholder: "#c77dff",
    
    accent: "#7b2cbf",
    accentLight: "#9d4edd",
    highlight: "#e0aaff",
  },
  "3d": {
    sceneBackground: "#10002b",
    fresnelColor: "#9d4edd",
    envColor: "#240046",
    coreColor: "#c77dff",
    tubeColor: "#e0aaff",
    touchpadBaseColor: "#9d4edd",
    touchpadCornersColor: "#7b2cbf",
    touchpadVisualizerColor: "#e0aaff",
  }
};

// Create and export the theme store
export const themeStore = createThemeStore(defaultTheme, [darkTheme, lightTheme, neonTheme]);

export default themeStore; 