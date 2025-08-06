import {
    Observe
} from "./_/observe";
import gsap from "@/gsap";
import {
    lerp
} from '../utils/math';
import {
    transform
} from '../utils/transform';
import {
    isMobile
} from "@/utils/media";
import {
    AudioToggler
} from "./AudioToggler";

export class Cursor extends Observe {
    constructor(element) {
        super(element);

        this.el = element;
        this.cursorLabel = this.el.querySelector('.cursor__label');
        this.isClicked = false;

        this.onFirstInteraction = this.onFirstInteraction.bind(this);

        this.init();
    }

    init() {
        if (isMobile()) return;

        document.addEventListener('click', this.onFirstInteraction);

        this.hasMoved = false;
        this.mouse = {
            x: 0,
            y: 0,
            lerpedX: 0,
            lerpedY: 0
        };
        this.animate();

        this.bindMousemove = this.mousemove.bind(this);
        window.addEventListener('mousemove', this.bindMousemove);

        this.bindEnter = this.hover.bind(this);
        this.bindLeave = this.leave.bind(this);

        this.hoverElements = document.querySelectorAll('a, .loader-w');
        this.hoverElements.forEach(el => {
            el.addEventListener('mouseenter', this.bindEnter);
            el.addEventListener('mouseleave', this.bindLeave);
        });

        this.tlCursorIn = gsap.timeline({
                paused: true,
                defaults: {
                    ease: 'none',
                    duration: 0.8
                }
            })
            .fromTo(this.cursorLabel, {
                opacity: 0
            }, {
                opacity: 1
            })
            .fromTo(this.cursorLabel, {
                text: ''
            }, {
                text: {
                    value: "[   Click to enable sound   ]",
                    preserveSpaces: true,
                    padSpaces: true,
                    speed: 2
                }
            }, ">");

        this.tlCursorOut = gsap.timeline({
            paused: true,
            defaults: {
                ease: 'none',
                duration: 0.6
            },
            onComplete: () => {
                this.destroy();
                this.el.remove();
            }
        }).to(this.el, {
            opacity: 0,
            filter: 'blur(1rem)'
        }, ">");
    }

    onFirstInteraction() {
        if (this.isClicked) return;
        this.isClicked = true;

        const audioToggleEl = document.querySelector('.sound-w');
        if (audioToggleEl) {
            new AudioToggler(audioToggleEl); // instantiate here
        } else {
            console.warn('[AudioToggler] No .sound__btn found');
        }

        this.tlCursorOut.play();

        document.removeEventListener('click', this.onFirstInteraction);
    }

    mousemove(e) {
        if (!this.hasMoved) {
            this.hasMoved = true;
            this.el.classList.add('has-moved');
            this.tlCursorIn.play();
        }

        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    hover(e) {
        if (this.delayedCall) this.delayedCall.kill();
        this.el.classList.add('has-hover');
    }

    leave(e) {
        this.el.classList.remove('has-hover');
    }

    destroy() {
        if (isMobile()) return;

        window.removeEventListener('mousemove', this.bindMousemove);
        this.hoverElements.forEach(el => {
            el.removeEventListener('mouseenter', this.bindEnter);
            el.removeEventListener('mouseleave', this.bindLeave);
        });

        cancelAnimationFrame(this.raf);
    }

    animate() {
        this.raf = requestAnimationFrame(() => this.animate());

        this.mouse.lerpedX = lerp(this.mouse.lerpedX, this.mouse.x, 0.1);
        this.mouse.lerpedY = lerp(this.mouse.lerpedY, this.mouse.y, 0.1);

        const rotation = (this.mouse.x - this.mouse.lerpedX) * 0.02;
        transform(this.el, `translate3d(${this.mouse.lerpedX}px,${this.mouse.lerpedY}px,0) rotate(${rotation}deg)`);
    }
}