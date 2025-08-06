import {
    Observe
} from "./_/observe";
import {
    Scroll
} from '@/scroll'
import gsap, {
    easePrimary,
    Flip
} from "@/gsap";
import {
    html
} from '@/utils/environment';
import Hey from '../utils/hey';

const CLASS = {
    MODAL_OPEN: `has-modal-open`,
};

export class Modal extends Observe {
    static instance = null;

    constructor(element, translinkInstance) {
        super(element);

        if (Modal.instance) return Modal.instance;

        this.element = element;
        this.translink = translinkInstance;
        Modal.instance = this;

        this.init();

    }

    init() {
        // console.log("Initializing Modal...");

        this.$modal = this.element;
        this.$modalCloseWrapper = this.$modal ? .querySelector('.modal__close-w');
        if (!this.$modal || !this.$modalCloseWrapper) return;

        gsap.set(this.$modal, {
            autoAlpha: 0,
            display: "none"
        });
        this.$modalCloseWrapper.onclick = () => this.close();

        this.anim = gsap.timeline({
                paused: true
            })
            .set(this.$modal, {
                autoAlpha: 1,
                display: "flex"
            })
            .fromTo(this.$modal, {
                scale: 1.05,
                opacity: 0,
                filter: "blur(0.5rem)",
                transformOrigin: "center center",
            }, {
                duration: 0.8,
                ease: "expo.out",
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
            }, '<');

        this.closeBind = (e) => {
            if (e.key === "Escape") this.close();
        };
        document.addEventListener('keyup', this.closeBind);
    }

    open() {
        html.classList.add(CLASS.MODAL_OPEN);
        // Scroll.stop();
        setTimeout(() => {
            this.anim.timeScale(1).play();
            const firstAccordion = document.querySelector('.accordion-w .accordion:first-child summary');
            firstAccordion ? .click();
        }, 200);
    }

    close() {
        html.classList.remove(CLASS.MODAL_OPEN);
        this.anim.timeScale(1.2).reverse();
        this.closeAllAccordions();
        // Scroll.start();

        if (this.translink) {
            const originalContainer = document.querySelector(".main");
            const form = this.translink.form;

            gsap.to(form, {
                y: 40,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    const flipState = Flip.getState(form, {
                        props: "width,height,borderRadius,opacity",
                        simple: true
                    });

                    originalContainer.appendChild(form);
                    Flip.from(flipState, {
                        duration: 0.8,
                        ease: "power2.inOut",
                        onStart: () => this.translink.transitionToState(this.translink.STATES.INITIAL),
                        onComplete: () => {
                            gsap.to(form, {
                                y: 0,
                                opacity: 1,
                                duration: 0.3,
                                ease: easePrimary
                            });
                        }
                    });
                }
            });
        }
    }

    toggle() {
        if (html.classList.contains(CLASS.MODAL_OPEN)) this.close();
        else this.open();
    }

    closeAllAccordions() {
        const accordions = document.querySelectorAll('.accordion-w .accordion');
        accordions.forEach(acc => acc.open = false);
    }

    destroy() {
        // console.log('Destroying Modal...');

        document.removeEventListener('keyup', this.closeBind);
        this.anim ? .kill();
        Modal.instance = null;
    }


}