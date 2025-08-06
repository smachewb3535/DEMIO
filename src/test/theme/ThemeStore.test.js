/**
 * Tests for ThemeStore functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createThemeStore } from '../../js/theme/createThemeStore'

describe('ThemeStore', () => {
  let themeStore
  let defaultTheme
  let testTheme

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    defaultTheme = {
      name: 'Default',
      version: '1.0',
      ui: {
        background: '#050D15',
        text: '#ffffff',
        accent: '#41a5ff'
      },
      '3d': {
        sceneBackground: '#133153',
        fresnelColor: '#60b2ff'
      }
    }

    testTheme = {
      name: 'Test',
      version: '1.0',
      ui: {
        background: '#000000',
        text: '#ffffff',
        accent: '#ff0000'
      },
      '3d': {
        sceneBackground: '#000000',
        fresnelColor: '#ff0000'
      }
    }

    themeStore = createThemeStore(defaultTheme, [testTheme])
  })

  it('should initialize with default theme', () => {
    const currentTheme = themeStore.getCurrentTheme()
    expect(currentTheme.name).toBe('Default')
    expect(currentTheme.ui.background).toBe('#050D15')
  })

  it('should set and get themes correctly', () => {
    themeStore.setTheme(testTheme)
    const currentTheme = themeStore.getCurrentTheme()
    expect(currentTheme.name).toBe('Test')
    expect(currentTheme.ui.accent).toBe('#ff0000')
  })

  it('should update individual colors', () => {
    themeStore.updateColor('ui', 'accent', '#00ff00')
    const currentTheme = themeStore.getCurrentTheme()
    expect(currentTheme.ui.accent).toBe('#00ff00')
  })

  it('should reset to default theme', () => {
    themeStore.setTheme(testTheme)
    themeStore.resetToDefault()
    const currentTheme = themeStore.getCurrentTheme()
    expect(currentTheme.name).toBe('Default')
  })

  it('should persist theme to localStorage', () => {
    themeStore.setTheme(testTheme)
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'translink-theme',
      JSON.stringify(testTheme)
    )
  })

  it('should handle theme subscription', () => {
    const callback = vi.fn()
    const unsubscribe = themeStore.subscribe(callback)
    
    themeStore.setTheme(testTheme)
    expect(callback).toHaveBeenCalledWith(testTheme)
    
    unsubscribe()
    themeStore.resetToDefault()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should export theme as JSON', () => {
    // Mock URL.createObjectURL and related APIs
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()
    
    const createElementSpy = vi.spyOn(document, 'createElement')
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')
    
    themeStore.exportTheme()
    
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
  })

  it('should import valid theme JSON', () => {
    const themeJSON = JSON.stringify(testTheme)
    const result = themeStore.importTheme(themeJSON)
    
    expect(result).toBe(true)
    const currentTheme = themeStore.getCurrentTheme()
    expect(currentTheme.name).toBe('Test')
  })

  it('should reject invalid theme JSON', () => {
    const invalidJSON = '{"invalid": "theme"}'
    const result = themeStore.importTheme(invalidJSON)
    
    expect(result).toBe(false)
  })

  it('should get available themes', () => {
    const availableThemes = themeStore.getAvailableThemes()
    expect(availableThemes).toHaveLength(2)
    expect(availableThemes[0].name).toBe('Default')
    expect(availableThemes[1].name).toBe('Test')
  })

  it('should get 3D colors', () => {
    const colors3D = themeStore.get3DColors()
    expect(colors3D.sceneBackground).toBe('#133153')
    expect(colors3D.fresnelColor).toBe('#60b2ff')
  })
})