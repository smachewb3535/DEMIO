import {
    Observe
} from "./_/observe";
import gsap, {
    reduced,
    easePrimary,
    easeGentleIn,
    easeQuickSnap,
    easeInstant,
    easeBlur,
    easeMenu,
    easeDirectional
} from "@/gsap"

export class Parallax extends Observe {
    constructor(element) {
        super(element);

        this.el = element;

        this.events = {
            mouseenter: {
                wrap: 'hover'
            }
        }

        // console.log(this.el, this.events);
        this.title = this.el.querySelector('.section__title')
        this.desc = this.el.querySelector('.section__desc')
        gsap.set(this.desc, {
            yPercent: 250
        })
        this.initParallax()
    }

    initParallax(next) {
        if (reduced) return;
        if (!next) next = document;
        // let parallax = next.querySelectorAll("[data-parallax-trigger]");
        // if (!parallax) return;
        // parallax.forEach((trigger) => {
        //   let target = trigger.querySelector("[data-parallax-target]");
        // gsap.to(target, {
        gsap.to(this.desc, {
            scrollTrigger: {
                trigger: this.el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                ease: easeDirectional
                // markers: true
            },
            yPercent: 0,
        });
        gsap.to(this.title, {
            scrollTrigger: {
                trigger: this.el,
                start: "top -160%",
                end: "bottom -=300%",
                scrub: 1.5,
                ease: easeDirectional
                // markers: true
            },
            yPercent: -150,
            // opacity: 0
        });
        // });
    }
}