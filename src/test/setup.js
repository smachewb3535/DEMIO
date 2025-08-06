/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest'

// Mock WebGL context
global.WebGLRenderingContext = vi.fn()
global.WebGL2RenderingContext = vi.fn()

// Mock canvas
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(() => ({
    onsuccess: vi.fn(),
    onerror: vi.fn(),
    onupgradeneeded: vi.fn(),
  })),
}

// Mock audio context
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  destination: {},
}))

// Mock fetch
global.fetch = vi.fn()

// Setup DOM
document.body.innerHTML = `
  <div id="app">
    <canvas data-gl-canvas></canvas>
    <main class="main-wrapper">
      <div class="loader-w">
        <div class="loader"></div>
      </div>
    </main>
  </div>
`

// Add CSS custom properties for tests
document.documentElement.style.setProperty('--color-background', '#050D15')
document.documentElement.style.setProperty('--color-text', '#ffffff')
document.documentElement.style.setProperty('--color-accent', '#41a5ff')