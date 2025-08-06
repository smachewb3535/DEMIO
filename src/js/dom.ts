import { createModules } from "./modules/_/index";

export class _Dom {
  #items: any[] = [];

  constructor() {
    queueMicrotask(() => {
      this.#create();
      this.start();
    });
  }

  /** Lifecycles */

  #create() {
    this.#items = createModules();
  }

  start() {
    this.#items.forEach((item) => item.start?.());
  }

  stop() {
    this.#items.forEach((item) => item.stop?.());
  }

  async transitionOut() {
    await Promise.all(this.#items.map((item) => item.transitionOut?.()));
  }

  async transitionIn() {
    this.#create();
    await Promise.all(this.#items.map((item) => item.transitionIn?.()));
  }

  /** Transitions */
  handlePageOut() { }
  handlePageIn() { }
}

export const Dom = new _Dom();
