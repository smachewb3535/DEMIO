import {
    Observe
} from "./_/observe";
import gsap from "@/gsap";
import SplitText from "gsap/SplitText";
gsap.registerPlugin(SplitText);

import {
    computeParams
} from "./_/index";

const split = (element) => {
    const unsplit = element.innerHTML;
    const type = element.dataset.type || "words";
    const split = new SplitText(element, {
        type
    });

    element.setAttribute("aria-label", unsplit);
    split.result = split[type];
    return split;
};

// //////////////////////////////////////////

export class Text extends Observe {#
    anim;
    split;

    anim = {
        autoAlpha: 1,
    };

    constructor(element) {
        super(element);
        // console.log(element);

        this.create();
        this.isOut();
        this.test()
    }

    create() {
        if (gsap.reduced) return;

        this.split = split(this.element).result;
        computeParams(this.element, this.anim);
    }

    isIn = () => {
        if (gsap.reduced) return;

        this.element.classList.add("is-inview");
        // console.log(this.element, this.inView);

        this.#anim = gsap.to(this.split, {
            ...this.anim,
        });
    };

    isOut = () => {
        if (gsap.reduced) return;

        if (this.element.classList.contains("is-inview"))
            this.element.classList.remove("is-inview");

        // console.log("out");

        if (this.#anim) this.#anim.kill();
        gsap.set(this.split, {
            autoAlpha: 0,
        });
    };

}