import * as THREE from 'three';
import Gl from '../gl/Gl';
import themeStore from './ThemeStore';

/**
 * ThemeUpdater - Updates 3D scene materials based on theme changes
 */
class ThemeUpdater {
  /**
   * Create a new ThemeUpdater instance
   * 
   * @param {Object} gl - The WebGL instance
   * @param {Object} themeStore - The theme store
   */
  constructor(gl, themeStore) {
    console.log('ThemeUpdater: Initializing with GL instance');
    
    this.gl = gl;
    this.themeStore = themeStore;
    this.colors = themeStore.get3DColors();
    
    // Subscribe to theme changes
    this.unsubscribe = themeStore.subscribe(theme => {
      this.handleThemeChange(theme);
    });
    
    // Apply initial theme
    this.updateSceneColors();
  }
  
  /**
   * Set a new GL instance
   * 
   * @param {Object} gl - The new WebGL instance
   */
  setGL(gl) {
    console.log('ThemeUpdater: Setting new GL instance');
    
    if (!gl) {
      console.error('ThemeUpdater: Cannot set null GL instance');
      return;
    }
    
    this.gl = gl;
    
    // Apply current theme to the new GL instance
    this.updateSceneColors();
  }
  
  /**
   * Handle theme change
   * 
   * @param {Object} theme - The new theme
   */
  handleThemeChange(theme) {
    if (!theme || !theme['3d']) {
      console.error('ThemeUpdater: Invalid theme object', theme);
      return;
    }
    
    console.log('ThemeUpdater: Theme changed to', theme.name);
    this.colors = theme['3d'];
    this.updateSceneColors();
  }
  
  /**
   * Update scene colors based on current theme
   */
  updateSceneColors() {
    if (!this.gl || !this.gl.world) {
      console.warn('ThemeUpdater: GL or world not available yet, skipping update');
      return;
    }
    
    console.log('ThemeUpdater: Updating scene colors');
    
    try {
      this.updateSceneBackground();
      this.updateMaterialColors();
      this.updateFleetTelematicsColors();
    } catch (error) {
      console.error('ThemeUpdater: Error updating scene colors', error);
    }
  }
  
  /**
   * Update scene background color
   */
  updateSceneBackground() {
    if (!this.gl || !this.gl.renderer) {
      console.warn('ThemeUpdater: GL renderer not available');
      return;
    }
    
    try {
      const bgColor = this.colors.sceneBackground;
      if (bgColor && this.gl.renderer.setClearColor) {
        console.log('ThemeUpdater: Setting scene background to', bgColor);
        this.gl.renderer.setClearColor(bgColor);
      }
    } catch (error) {
      console.error('ThemeUpdater: Error updating scene background', error);
    }
  }
  
  /**
   * Update material colors for all scenes
   */
  updateMaterialColors() {
    if (!this.gl || !this.gl.world) {
      console.warn('ThemeUpdater: GL world not available');
      return;
    }
    
    try {
      this.updateMainSceneMaterials();
      this.updateSpecsSceneMaterials();
      this.updateFWASceneMaterials();
    } catch (error) {
      console.error('ThemeUpdater: Error updating material colors', error);
    }
  }
  
  /**
   * Update main scene materials
   */
  updateMainSceneMaterials() {
    const scene = this.gl.world.scenes.main;
    if (!scene) {
      console.log('ThemeUpdater: Main scene not available');
      return;
    }
    
    try {
      console.log('ThemeUpdater: Updating main scene materials');
      
      // Update fresnel material
      if (scene.fresnelMaterial && scene.fresnelMaterial.uniforms) {
        scene.fresnelMaterial.uniforms.uFresnelColor.value.set(this.colors.fresnelColor);
      }
      
      // Update environment material
      if (scene.envMaterial && scene.envMaterial.uniforms) {
        scene.envMaterial.uniforms.uEnvColor.value.set(this.colors.envColor);
      }
      
      // Update core material
      if (scene.coreMaterial && scene.coreMaterial.uniforms) {
        scene.coreMaterial.uniforms.uCoreColor.value.set(this.colors.coreColor);
      }
      
      // Update tube material
      if (scene.tubeMaterial && scene.tubeMaterial.uniforms) {
        scene.tubeMaterial.uniforms.uTubeColor.value.set(this.colors.tubeColor);
      }
    } catch (error) {
      console.error('ThemeUpdater: Error updating main scene materials', error);
    }
  }
  
  /**
   * Update specs scene materials
   */
  updateSpecsSceneMaterials() {
    const scene = this.gl.world.scenes.specs;
    if (!scene) {
      console.log('ThemeUpdater: Specs scene not available');
      return;
    }
    
    try {
      console.log('ThemeUpdater: Updating specs scene materials');
      
      // Update touchpad materials
      if (scene.touchpadBaseMaterial && scene.touchpadBaseMaterial.uniforms) {
        scene.touchpadBaseMaterial.uniforms.uBaseColor.value.set(this.colors.touchpadBaseColor);
      }
      
      if (scene.touchpadCornersMaterial && scene.touchpadCornersMaterial.uniforms) {
        scene.touchpadCornersMaterial.uniforms.uCornersColor.value.set(this.colors.touchpadCornersColor);
      }
      
      if (scene.touchpadVisualizerMaterial && scene.touchpadVisualizerMaterial.uniforms) {
        scene.touchpadVisualizerMaterial.uniforms.uVisualizerColor.value.set(this.colors.touchpadVisualizerColor);
      }
    } catch (error) {
      console.error('ThemeUpdater: Error updating specs scene materials', error);
    }
  }
  
  /**
   * Update FWA scene materials
   */
  updateFWASceneMaterials() {
    const scene = this.gl.world.scenes.fwa;
    if (!scene) {
      console.log('ThemeUpdater: FWA scene not available');
      return;
    }
    
    try {
      console.log('ThemeUpdater: Updating FWA scene materials');
      
      // Update FWA-specific materials here
      // This is a placeholder for future implementation
    } catch (error) {
      console.error('ThemeUpdater: Error updating FWA scene materials', error);
    }
  }
  
  /**
   * Update Fleet Telemetrics particle colors
   */
  updateFleetTelematicsColors() {
    if (!this.gl || !this.gl.world) {
      return;
    }

    try {
      console.log('ThemeUpdater: Updating Fleet Telemetrics colors...');
      
      // Update all active scenes
      Object.values(this.gl.world.scenes).forEach(scene => {
        if (scene && scene.particles) {
          // Handle both old and new particle systems
          if (scene.particles.fleetTelematicsParticles) {
            this.updateFleetTelematicsParticleColors(scene.particles.fleetTelematicsParticles);
          }
          if (scene.particles.textElements) {
            this.updateFleetTelematicsParticleColors(scene.particles);
          }
        }
      });

      // Update active scene specifically
      if (this.gl.world.activeScenes && this.gl.world.activeScenes.current) {
        const currentScene = this.gl.world.activeScenes.current;
        if (currentScene.particles) {
          if (currentScene.particles.fleetTelematicsParticles) {
            this.updateFleetTelematicsParticleColors(currentScene.particles.fleetTelematicsParticles);
          }
          if (currentScene.particles.textElements) {
            this.updateFleetTelematicsParticleColors(currentScene.particles);
          }
        }
      }
      
      console.log('ThemeUpdater: Fleet Telemetrics colors updated successfully');
    } catch (error) {
      console.error('ThemeUpdater: Error updating Fleet Telemetrics colors', error);
    }
  }

  /**
   * Update individual Fleet Telemetrics particle system colors
   */
  updateFleetTelematicsParticleColors(fleetTelematicsParticles) {
    if (!fleetTelematicsParticles) {
      return;
    }
    
    // Handle both old and new particle systems
    const textElements = fleetTelematicsParticles.textElements || 
                        fleetTelematicsParticles.activeElements?.map(obj => obj.mesh) || 
                        [];
    
    if (textElements.length === 0) {
      console.warn('ThemeUpdater: No text elements found in Fleet Telemetrics particles');
      return;
    }

    // Update CSS custom properties for Fleet Telemetrics
    const root = document.documentElement;
    root.style.setProperty('--fleet-particle-primary', this.colors.fresnelColor || '#60b2ff');
    root.style.setProperty('--fleet-particle-warning', this.colors.warningColor || '#ffb366');
    root.style.setProperty('--fleet-particle-critical', this.colors.criticalColor || '#ff6b6b');
    root.style.setProperty('--fleet-particle-success', this.colors.successColor || '#66ff66');
    root.style.setProperty('--fleet-particle-bg', this.colors.sceneBackground || 'rgba(19, 49, 83, 0.85)');
    root.style.setProperty('--fleet-particle-border', this.colors.fresnelColor ? `${this.colors.fresnelColor}33` : 'rgba(96, 178, 255, 0.3)');

    // Update individual text elements
    textElements.forEach(item => {
      // Handle different data structures
      const element = item.userData?.element || item.element;
      if (element) {
        // Apply theme-based colors
        element.style.color = this.colors.fresnelColor || '#60b2ff';
        element.style.textShadow = `0 0 8px ${this.colors.fresnelColor || '#60b2ff'}66`;
        element.style.borderColor = `${this.colors.fresnelColor || '#60b2ff'}33`;

        // Update background based on scene background
        const bgColor = this.colors.sceneBackground || '#133153';
        element.style.background = `${bgColor}dd`; // Add alpha
      }
    });
    
    console.log('ThemeUpdater: Updated', textElements.length, 'Fleet Telemetrics elements');
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('ThemeUpdater: Disposing');

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.gl = null;
    this.themeStore = null;
    this.colors = null;
  }
}

export default ThemeUpdater; 