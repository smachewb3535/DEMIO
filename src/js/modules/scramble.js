import {
    Observe
} from "./_/observe";
import gsap, {
    SplitText
} from "@/gsap";
// import SplitText from "gsap/SplitText";
// gsap.registerPlugin(SplitText);
import {
    isMobile
} from "@/utils/media";

export class Scramble extends Observe {
    constructor(element) {
        super(element);

        this.el = element;

        this.events = {
            mouseenter: {
                wrap: 'hover'
            }
        }


        this.needOnMobile = true;

        if (typeof this.el.dataset.desktop == 'string') {
            this.needOnMobile = false;
        }

        // Options
        this.auto = typeof this.el.dataset.auto == 'string';
        this.delay = typeof this.el.dataset.delay == 'string' ? parseFloat(this.el.dataset.delay) : 0;
        this.stagger = typeof this.el.dataset.stagger == 'string' ? parseFloat(this.el.dataset.stagger) : 0.2;
        this.duration = typeof this.el.dataset.duration == 'string' ? parseFloat(this.el.dataset.duration) : 1;
        this.iteration = typeof this.el.dataset.iteration == 'string' ? parseFloat(this.el.dataset.iteration) : 1;

        this.init();
        // this.isScrolling()
    }

    init() {

        if (isMobile && !this.needOnMobile) {
            return;
        }

        this.split = new SplitText(this.el, {
            type: 'chars, words'
        });
        // this.hide(0, 0);

    }

    ready() {
        if (isMobile && !this.needOnMobile) {
            return;
        }

        if (this.auto) {
            this.display(this.delay, this.duration, this.stagger, this.iteration);
            gsap.delayedCall(this.delay, () => {
                this.el.classList.add('is-inview');
            });
        }
    }

    isIn = () => {
        if (gsap.reduced) return;
        this.display(.2, this.duration, this.stagger, this.iteration);
    };

    isOut = () => {
        if (gsap.reduced) return;
        this.hide();
    };

    toggle(e) {

        if (isMobile && !this.needOnMobile) {
            return;
        }

        if (e.mode == 'enter') {
            this.display(this.delay, this.duration, this.stagger, this.iteration);

        } else {
            this.hide();
        }
    }

    display(delay = 0, duration = 0.1, stagger = 0.2, iteration = 1) {

        if (isMobile && !this.needOnMobile) {
            return;
        }

        if (this.split == undefined) {
            return;
        }

        if (this.tl != undefined) {
            this.tl.kill();
        }
        this.tl = gsap.timeline();

        for (let index = 0; index < iteration; index++) {
            this.tl.to(this.split.chars, {
                alpha: index % 2 == 0 ? 1 : 0,
                duration: duration / iteration,
                delay: index == 0 ? delay : 0,
                ease: "power2.out",
                stagger: {
                    amount: stagger,
                    from: "random"
                }
            });
        }
    }

    hide(delay = 0, duration = 0.1) {
        if (isMobile && !this.needOnMobile) {
            return;
        }

        if (this.split == undefined) {
            return;
        }

        if (this.tl != undefined) {
            this.tl.kill();
        }
        this.tl = gsap.timeline();

        this.tl.to(this.split.chars, {
            alpha: 0.001,
            duration,
            delay,
            ease: "power2.in",
            stagger: {
                amount: 0.05,
                from: "random"
            }
        });
    }

    isScrolling() {
        // Create timeline for hero section animation with film roll effect
        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".s",
                start: "top top", // Start at the very beginning
                end: "+=50% top", // End after 400px of scrolling - longer duration
                scrub: 1, // Slower scrub for smoother animation
                // markers: true
            }
        });

        // Animate each element in the header content with a film roll effect
        gsap.utils.toArray(".s.is--hero .section-w > *").forEach((element, index) => {
            // gsap.utils.toArray(".header-content > *").forEach((element, index) => {
            heroTl.to(
                element, {
                    rotationX: 90,
                    y: -30,
                    scale: 0.8, // Scale down as it rotates away
                    opacity: 0,
                    filter: "blur(1rem)", // Add blur effect
                    ease: "power3.inOut", // Better easing
                    transformOrigin: "center top"
                },
                index * 0.08
            ); // More spacing between elements
        });
    }

    destroy() {
        if (isMobile && !this.needOnMobile) {
            return;
        }

        if (this.tl != undefined) {
            this.tl.kill();
        }
    }

}