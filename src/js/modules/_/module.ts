export interface ModuleInterface {
  element: HTMLElement;
  start(): void;
  stop(): void;
  transitionIn(): void;
  transitionOut(): void;
  destroy(): void;
}

export abstract class Module implements ModuleInterface {
  element: HTMLElement;
  
  constructor(element: HTMLElement) {
    this.element = element;
  }

  // Abstract methods that must be implemented by subclasses
  abstract start(): void;
  abstract stop(): void;
  
  // Default implementations that can be overridden
  transitionIn(): void {
    // Default transition in behavior
  }
  
  transitionOut(): void {
    // Default transition out behavior
  }
  
  destroy(): void {
    // Default cleanup behavior
  }
}
