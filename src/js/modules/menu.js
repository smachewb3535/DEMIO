import {
    Observe
} from "./_/observe";
import {
    Scroll
} from '@/scroll'
import gsap, {
    easeBlur,
    easeMenu
} from "@/gsap";
import {
    html
} from '@/utils/environment';
import Gl from "@/gl/Gl";
import ScrollController from "./ScrollController";
import Hey from '../utils/hey'

const CLASS = {
    OPEN: `has-menu-open`,
    MODAL_OPEN: `has-modal-open`,
}

export class Menu extends Observe {
    static instance = null;

    constructor(element) {
        super(element);

        if (Menu.instance) return Menu.instance;
        Menu.instance = this;

        this.gl = new Gl();
        this.stops = [0, 0.125, 0.25, 0.375, 0.375, 0.5, 0.625, 0.742, 0.81, 1];

        // Core nodes
        this.$menu = element; // <nav id="main-nav">, the menu container
        this.$menuToggle = document.getElementById('menu-toggle'); // burger button
        this.$navLine = this.$menu.querySelector('.nav__line');
        this.$navItems = this.$menu.querySelectorAll('.nav__item');
        this.$navLinks = this.$menu.querySelectorAll('.nav__link');
        this.$navCTA = this.$menu.querySelector('.nav__cta');
        this.$navBurger = this.$menu.querySelector('.nav__burger');
        this.$navBurgerCircles = this.$menu.querySelectorAll('.nav__burger circle');
        this.$navLogo = document.querySelector('.nav__logo');
        this.$navLogoCircles = document.querySelectorAll('.nav__logo circle:not(:nth-child(5))');

        gsap.set(this.$menu, {
            height: "4.6rem"
        });

        // Event handlers
        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleFocusTrap = this.handleFocusTrap.bind(this);
        this.closeBind = (e) => {
            if (e.key === "Escape") this.close();
        };
        this.outsideClickBind = (e) => {
            if (!this.$menu.contains(e.target) && e.target !== this.$menuToggle) {
                this.close();
            }
        };

        // --- Event listeners ---
        // Only the menu toggle opens/closes menu
        this.$menuToggle.addEventListener('click', this.toggle.bind(this));
        this.$menuToggle.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Keyboard ESC to close
        document.addEventListener('keyup', this.closeBind);

        // Menu: click on link/call-to-action (not the burger)
        this.$menu.addEventListener('click', this.handleMenuClick);

        // Burger hover
        this.$menuToggle.addEventListener('mouseenter', () => this.tlBurger ? .play());
        this.$menuToggle.addEventListener('mouseleave', () => this.tlBurger ? .pause().progress(0));

        // Accessibility attributes
        this.$menu.setAttribute('role', 'navigation');
        this.$menu.setAttribute('aria-label', 'Main navigation');
        this.$menu.setAttribute('hidden', '');
        this.$menuToggle.setAttribute('aria-expanded', 'false');

        this.init();
    }

    init() {
        this.tlMenu = gsap.timeline({
            paused: true,
            defaults: {
                ease: easeBlur,
                duration: 0.6
            },
        })
        this.tlMenu
            .to(this.$menu, {
                height: "auto",
                backgroundColor: "rgba(5, 13, 21, 0.8)"
            })
            // .fromTo(this.$menu, { height: "4.6rem", backgroundColor: "rgba(5, 13, 21, 0.08)" }
            //   , { height: "auto", backgroundColor: "rgba(5, 13, 21, 0.8)" })
            // this.tlMenu
            //   .fromTo(this.$menu, { height: "4.6rem", backgroundColor: "rgba(255, 255, 255, 0.08)" }
            //     , { height: "auto", backgroundColor: "rgba(255, 255, 255, 0.08)" })

            .fromTo(this.$navLine, {
                scale: 0,
                transformOrigin: "center center"
            }, {
                scale: 1,
                ease: "expo.out"
            }, '<.2')
            .fromTo(this.$navLinks, {
                yPercent: -100
            }, {
                yPercent: 0,
                stagger: 0.05,
                clearProps: true
            }, "<")
            .fromTo(this.$navCTA, {
                opacity: 0,
                filter: "blur(.5rem)",
                scale: 1.05
            }, {
                opacity: 1,
                filter: "blur(0rem)",
                scale: 1
            }, ">-.6")
        // .to(this.$menu, { backgroundColor: "rgba(5, 13, 21, 0.8)" })


        this.tlBurger = gsap.timeline({
                paused: true
            })
            .to(this.$navLogo, {
                rotate: 180,
                ease: easeMenu
            })
            .to(this.$navBurgerCircles, {
                scale: 0,
                transformOrigin: "center center",
                stagger: {
                    each: 0.1,
                    from: "random",
                    repeat: -1,
                    yoyo: true
                },
                ease: easeMenu,
                duration: 0.3
            }, "<")
            .to(this.$navLogoCircles, {
                scale: 0,
                transformOrigin: "center center",
                stagger: {
                    each: 0.1,
                    from: "random"
                },
                ease: easeMenu,
                duration: 0.3
            }, ">-.2");
    }

    handleMenuClick(e) {
        // Ignore clicks from menu toggle (burger), only handle menu content ONLY HOMEPAGE!!
        if (Hey.PAGE_SLUG === '/') {
            const navLink = e.target.closest('.nav__link');
            if (navLink && navLink.hasAttribute('data-anchor')) {
                const anchorIdx = Number(navLink.dataset.anchor);
                const anchor = ScrollController.getSectionAnchor(anchorIdx);
                console.log(anchor);

                Scroll.scrollTo(anchor, {
                    easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
                });
                this.close();
                return;
            }
        }

        if (e.target.closest('.nav__cta')) {
            this.close();
            return;
        }
    }

    open() {
        html.classList.add(CLASS.OPEN);
        this.$menuToggle.setAttribute('aria-expanded', 'true');
        this.$menu.removeAttribute('hidden');
        this.$menu.querySelector('.nav__list') ? .removeAttribute('inert');
        this.$menu.querySelector('.nav__cta') ? .removeAttribute('inert');
        // this.$navLinks[0]?.focus();
        this.tlMenu.timeScale(1).play();

        document.addEventListener('click', this.outsideClickBind);
        document.addEventListener('keydown', this.handleFocusTrap);
    }

    close() {
        html.classList.remove(CLASS.OPEN);
        this.$menuToggle.setAttribute('aria-expanded', 'false');
        this.$menu.setAttribute('hidden', '');
        this.$menu.querySelector('.nav__list') ? .setAttribute('inert', '');
        this.$menu.querySelector('.nav__cta') ? .setAttribute('inert', '');
        this.tlMenu.timeScale(1.75).reverse();

        document.removeEventListener('click', this.outsideClickBind);
        document.removeEventListener('keydown', this.handleFocusTrap);
        this.$menuToggle.focus();
    }


    handleFocusTrap(e) {
        if (!html.classList.contains(CLASS.OPEN)) return;
        if (e.key !== 'Tab') return;

        const focusable = Array.from(this.$menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'))
            .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    toggle() {
        if (html.classList.contains(CLASS.OPEN)) {
            this.close();
            this.gl.audio.playUI('uiMenuClose');
        } else {
            this.open();
            this.gl.audio.playUI('uiMenuOpen');
        }
    }

    destroy() {
        document.removeEventListener('keyup', this.closeBind);
        document.removeEventListener('click', this.outsideClickBind);
        document.removeEventListener('keydown', this.handleFocusTrap);
        this.$menu ? .removeEventListener('click', this.handleMenuClick);

        this.tlMenu ? .kill();
        this.tlBurger ? .kill();

        this.$menuToggle ? .setAttribute('aria-expanded', 'false');
        html.classList.remove(CLASS.OPEN);

        this.tlMenu = null;
        this.tlBurger = null;
        this.$menu = null;
        Menu.instance = null;
    }
}