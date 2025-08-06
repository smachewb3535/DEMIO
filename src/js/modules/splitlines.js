import {
    Observe
} from "./_/observe";
import gsap from "@/gsap";
import SplitText from "gsap/SplitText";
gsap.registerPlugin(SplitText);

export class SplitLines extends Observe {
    constructor(element) {
        super(element);

        this.el = element;
        // Options
        this.revealLines = this.el.dataset.releaveLines === 'true';
        this.delay = parseFloat(this.el.dataset.delay) || 0.0;
        this.stagger = parseFloat(this.el.dataset.stagger) || 0.02;
        this.hide = this.el.dataset.hide || false;

        // console.log(this.revealLines, this.delay, this.stagger);

        this.init();
        this.create();
        // this.isOut();

    }

    init() {
        this.el.setAttribute('aria-label', this.element.textContent);
    }

    destroy() {
        this.clear()
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize = () => {
        this.reSplit()
    }

    ///////////////
    // Methods
    ///////////////
    split() {
        this.splitObject = new SplitText(this.el, {
            type: "lines",
            linesClass: "u-lines-split"
        });
        this.splitObject.lines.forEach((line, i) => {
            line.style.setProperty('--line-index', i)
            line.setAttribute('aria-hidden', 'true')
        });

        // if (this.revealLines) {
        //     // Maybe a better way to do this with CSS progress
        //     this.tlScroll = gsap.timeline({
        //         scrollTrigger: {
        //             trigger: this.el,
        //             start: "top bottom-=25%",
        //             end: "bottom center",
        //             scrub: 1
        //         }
        //     })

        //     for (let i = 0; i < this.splitObject.lines.length; i++) {
        //         this.tlScroll.fromTo(this.splitObject.lines[i], {
        //             opacity: 0.25
        //         }, {
        //             opacity: 1
        //         })
        //     }
        // }
    }

    reSplit() {
        this.splitObject ? .revert ? .();

        requestAnimationFrame(() => {
            this.split();
        })
    }

    create() {
        if (gsap.reduced) return;

        this.split();
    }

    isIn = () => {
        if (gsap.reduced) return;

        if (!this.hide)
            this.element.classList.add("is-inview");


    };

    isOut = () => {
        if (gsap.reduced) return;

        if (this.element.classList.contains("is-inview")) {
            // this.element.classList.remove("is-inview");
            this.hide = false
        }
    };

    clear() {
        this.splitObject ? .lines ? .forEach((line) => line.style.removeProperty('--line-index'));
        this.splitObject ? .revert ? .();
        this.splitObject = null;

        this.tlScroll ? .kill ? .();
        this.tlScroll = null;
    }


}