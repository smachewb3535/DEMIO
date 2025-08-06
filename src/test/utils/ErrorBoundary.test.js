/**
 * Tests for ErrorBoundary functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorBoundary } from '../../js/utils/ErrorBoundary'

describe('ErrorBoundary', () => {
  let errorBoundary
  let consoleSpy

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
    
    // Mock console.error
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    errorBoundary = new ErrorBoundary()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should initialize without errors', () => {
    expect(errorBoundary).toBeDefined()
    expect(errorBoundary.errors).toEqual([])
  })

  it('should handle JavaScript errors', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.js',
      lineno: 1,
      colno: 1,
      error: new Error('Test error')
    })

    window.dispatchEvent(errorEvent)

    expect(errorBoundary.errors).toHaveLength(1)
    expect(errorBoundary.errors[0].message).toBe('Test error')
    expect(errorBoundary.errors[0].type).toBe('javascript')
  })

  it('should handle unhandled promise rejections', () => {
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('Promise error')),
      reason: new Error('Promise error')
    })

    window.dispatchEvent(rejectionEvent)

    expect(errorBoundary.errors).toHaveLength(1)
    expect(errorBoundary.errors[0].type).toBe('promise')
  })

  it('should show error notification', () => {
    errorBoundary.showErrorMessage({
      message: 'Test error',
      type: 'javascript'
    })

    const notification = document.getElementById('error-notification')
    expect(notification).toBeTruthy()
    expect(notification.textContent).toContain('unexpected error')
  })

  it('should handle WebGL context loss', () => {
    // Mock canvas element
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-gl-canvas', '')
    document.body.appendChild(canvas)

    // Create new error boundary to pick up the canvas
    const newErrorBoundary = new ErrorBoundary()

    const contextLostEvent = new Event('webglcontextlost')
    canvas.dispatchEvent(contextLostEvent)

    const notification = document.getElementById('error-notification')
    expect(notification).toBeTruthy()
    expect(notification.textContent).toContain('Graphics context lost')
  })

  it('should clear errors', () => {
    errorBoundary.errors.push({ message: 'Test error' })
    expect(errorBoundary.errors).toHaveLength(1)
    
    errorBoundary.clearErrors()
    expect(errorBoundary.errors).toHaveLength(0)
  })

  it('should return error history', () => {
    const testError = { message: 'Test error', type: 'javascript' }
    errorBoundary.errors.push(testError)
    
    const history = errorBoundary.getErrorHistory()
    expect(history).toHaveLength(1)
    expect(history[0].message).toBe('Test error')
  })
})