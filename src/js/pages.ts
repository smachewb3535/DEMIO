import { Core } from "@unseenco/taxi";
import { Dom } from "./dom";
import hey from "./utils/hey";
import { Scroll } from "./scroll";
import { Transition } from "./transitions/default";

class _Pages extends Core {
  constructor() {
    super({
      links: "a:not([target]):not([href^=\\#]):not([data-taxi-ignore])",
      removeOldContent: true,
      allowInterruption: false,
      bypassCache: true,
      transitions: {
        default: Transition,
      },
    });

    hey.PAGE_SLUG = window.location.pathname;
  }

  async transitionOut(from: HTMLElement) {
    await Promise.all([Dom.transitionOut()]);
    Scroll.toTop();
  }

  async transitionIn(to: HTMLElement) {
    await Promise.all([Dom.transitionIn()]);
  }
}

const pages = new _Pages();
export const Pages = pages;
