/**
 * Accessibility Manager - Ensures WCAG compliance and keyboard navigation
 */

export class AccessibilityManager {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.isKeyboardNavigation = false;
    
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupARIALabels();
    this.setupReducedMotion();
    this.setupHighContrast();
  }

  setupKeyboardNavigation() {
    // Track keyboard usage
    document.addEventListener('keydown', (e) => {
      this.isKeyboardNavigation = true;
      document.body.classList.add('keyboard-navigation');
      
      // Handle tab navigation
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
      
      // Handle escape key
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Handle arrow keys for custom navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });

    // Track mouse usage
    document.addEventListener('mousedown', () => {
      this.isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    });
  }

  setupFocusManagement() {
    // Update focusable elements list
    this.updateFocusableElements();
    
    // Re-scan on DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  updateFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details summary'
    ].join(', ');

    this.focusableElements = Array.from(document.querySelectorAll(selector))
      .filter(el => {
        return el.offsetParent !== null && // Element is visible
               !el.hasAttribute('inert') && // Not inert
               window.getComputedStyle(el).visibility !== 'hidden';
      });
  }

  handleTabNavigation(e) {
    // Custom tab handling for complex UI components
    const activeElement = document.activeElement;
    
    // Handle modal focus trapping
    if (document.body.classList.contains('has-modal-open')) {
      this.trapFocusInModal(e);
    }
    
    // Handle menu focus trapping
    if (document.body.classList.contains('has-menu-open')) {
      this.trapFocusInMenu(e);
    }
  }

  trapFocusInModal(e) {
    const modal = document.querySelector('.modal-w');
    if (!modal) return;
    
    const focusableInModal = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableInModal.length === 0) return;
    
    const firstFocusable = focusableInModal[0];
    const lastFocusable = focusableInModal[focusableInModal.length - 1];
    
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }

  trapFocusInMenu(e) {
    const menu = document.querySelector('#main-nav');
    if (!menu) return;
    
    const focusableInMenu = menu.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableInMenu.length === 0) return;
    
    const firstFocusable = focusableInMenu[0];
    const lastFocusable = focusableInMenu[focusableInMenu.length - 1];
    
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }

  handleEscapeKey() {
    // Close modal if open
    if (document.body.classList.contains('has-modal-open')) {
      const modal = document.querySelector('.modal-w');
      if (modal) {
        const closeButton = modal.querySelector('.modal__close-w');
        if (closeButton) closeButton.click();
      }
    }
    
    // Close menu if open
    if (document.body.classList.contains('has-menu-open')) {
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) menuToggle.click();
    }
    
    // Close AI interface if expanded
    if (document.body.classList.contains('has-ai-open')) {
      const aiClose = document.querySelector('[data-ai="closeQuestion"]');
      if (aiClose) aiClose.click();
    }
  }

  handleArrowNavigation(e) {
    // Custom arrow key navigation for specific components
    const activeElement = document.activeElement;
    
    // Handle navigation in accordion lists
    if (activeElement && activeElement.closest('.accordion')) {
      this.handleAccordionNavigation(e);
    }
  }

  handleAccordionNavigation(e) {
    const accordions = Array.from(document.querySelectorAll('.accordion summary'));
    const currentIndex = accordions.indexOf(document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : accordions.length - 1;
        accordions[nextIndex].focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < accordions.length - 1 ? currentIndex + 1 : 0;
        accordions[nextIndex].focus();
        break;
    }
  }

  setupARIALabels() {
    // Add missing ARIA labels
    this.addARIAToElements();
    
    // Update ARIA states dynamically
    this.setupDynamicARIA();
  }

  addARIAToElements() {
    // Add ARIA labels to interactive elements without them
    const interactiveElements = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])'
    );
    
    interactiveElements.forEach(el => {
      if (!el.textContent.trim()) {
        // Add generic label for icon-only buttons
        if (el.querySelector('svg')) {
          el.setAttribute('aria-label', 'Interactive element');
        }
      }
    });

    // Add role attributes where missing
    const nav = document.querySelector('nav:not([role])');
    if (nav) nav.setAttribute('role', 'navigation');
    
    const main = document.querySelector('main:not([role])');
    if (main) main.setAttribute('role', 'main');
  }

  setupDynamicARIA() {
    // Update ARIA states when UI changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.updateARIAStates(mutation.target);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });
  }

  updateARIAStates(element) {
    // Update ARIA expanded states
    if (element.classList.contains('has-menu-open')) {
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    } else {
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
    
    // Update modal ARIA states
    if (element.classList.contains('has-modal-open')) {
      const modal = document.querySelector('.modal-w');
      if (modal) {
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('role', 'dialog');
      }
    } else {
      const modal = document.querySelector('.modal-w');
      if (modal) {
        modal.setAttribute('aria-hidden', 'true');
      }
    }
  }

  setupReducedMotion() {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionPreference = (e) => {
      if (e.matches) {
        document.body.classList.add('reduce-motion');
        // Disable animations in GSAP
        if (window.gsap) {
          window.gsap.globalTimeline.timeScale(0.01);
        }
      } else {
        document.body.classList.remove('reduce-motion');
        if (window.gsap) {
          window.gsap.globalTimeline.timeScale(1);
        }
      }
    };
    
    prefersReducedMotion.addEventListener('change', handleMotionPreference);
    handleMotionPreference(prefersReducedMotion);
  }

  setupHighContrast() {
    // Handle high contrast mode
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    
    const handleContrastPreference = (e) => {
      if (e.matches) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    };
    
    prefersHighContrast.addEventListener('change', handleContrastPreference);
    handleContrastPreference(prefersHighContrast);
  }

  // Skip to main content functionality
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Announce dynamic content changes to screen readers
  announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize accessibility manager
export const accessibilityManager = new AccessibilityManager();