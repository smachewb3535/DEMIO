import {
    Observe
} from "./_/observe";
import gsap from "@/gsap";
import {
    isMobile
} from "@/utils/media";

export class Outline extends Observe {
    constructor(element) {
        super(element);

        this.el = element;

        this.init();
    }

    init() {
        if (isMobile()) return;

        const wrappers = document.querySelectorAll(".specs__title-w");

        wrappers.forEach((wrapper) => {
            const content = wrapper.querySelector(".specs__title-outline");
            const mask = wrapper.querySelector(".specs__title-mask");

            if (!content || !mask) return;

            let xTo = gsap.quickTo(mask, "--x", {
                duration: 0.4,
                ease: "power4.out",
            });
            let yTo = gsap.quickTo(mask, "--y", {
                duration: 0.4,
                ease: "power4.out",
            });

            let tl = gsap.timeline({
                paused: true
            });
            tl.fromTo(mask, {
                "--size": "0rem",
            }, {
                "--size": "8rem",
                duration: .75,
                ease: "expo.out",
            });

            const hoveringContent = content.querySelectorAll(".specs__title");

            hoveringContent.forEach((el) => {
                el.addEventListener("mouseenter", () => {
                    mask.style.visibility = "visible";
                    tl.restart();
                });

                el.addEventListener("mouseleave", () => {
                    tl.reverse();
                    // mask.style.visibility = "hidden";
                });
            });

            wrapper.addEventListener("mousemove", onMouseMove);

            function onMouseMove(e) {
                const rect = content.getBoundingClientRect();
                const relX = e.clientX - rect.left;
                const relY = e.clientY - rect.top;

                xTo(`${relX}`);
                yTo(`${relY}`);
            }
        });
    }


}