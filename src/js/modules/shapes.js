import {
    Observe
} from "./_/observe";
import gsap, {
    reduced,
    easeInstant
} from "@/gsap";
import {
    computeParams
} from "./_/index";
import Hey from '../utils/hey'

const getShapeElements = (element) => {
    const shapeType = element.dataset.shapes || 'default';

    switch (shapeType) {
        case 'hero':
            return {
                paths: element.querySelectorAll('path'),
                circles: element.querySelectorAll('circle'),
                groups: element.querySelectorAll('g')
            };
        case 'crafted':
            return {
                paths: element.querySelectorAll('path'),
                circles: element.querySelectorAll('circle'),
                groups: element.querySelectorAll('g')
            };
        case 'power':
            return {
                paths: element.querySelectorAll('path'),
                circles: element.querySelectorAll('circle')
            };
        case 'connect':
            return {
                rects: element.querySelectorAll('rect'),
                circles: element.querySelectorAll('circle')
            };
        default:
            return {};
    }
};

export class Shapes extends Observe {#
    tl;
    elements;
    shapeType;

    constructor(element) {
        super(element);
        this.elements = getShapeElements(this.element);
        this.shapeType = this.element.dataset.shapes || 'default';
    }

    init() {
        if (gsap.reduced) return;
        this.create();
        this.isIn();
    }

    createTimeline() {
        if (gsap.reduced) return null;

        const tl = gsap.timeline({
            paused: true,
            repeat: -1,
            yoyo: true,
            repeatDelay: 0.2,
            defaults: {
                ease: easeInstant,
                duration: 0.8
            }
        });

        switch (this.shapeType) {
            case 'crafted':
                tl.fromTo(this.elements.circles, {
                        scale: 0,
                        transformOrigin: "50% 50%"
                    }, {
                        scale: 1,
                    }, '<')
                    .from(this.elements.paths, {
                        drawSVG: '0% 0%',
                        duration: 1.6
                    }, '<')
                    .to(this.elements.paths, {
                        drawSVG: '100% 100%',
                        duration: 1.6
                    }, '>')
                break;

            case 'power':
                tl.fromTo(this.elements.circles, {
                        scale: 0.8,
                        opacity: 0,
                        transformOrigin: "50% 50%"
                    }, {
                        duration: 1.6,
                        scale: 1,
                        opacity: 1,
                    })
                    .from(this.elements.paths, {
                        drawSVG: '50% 50%',
                        duration: 1.6
                    }, '<')
                break;

            case 'hero':
                tl.fromTo(this.elements.groups, {
                        scale: 0,
                        transformOrigin: "0% 50%",
                    }, {
                        scale: 1,
                        stagger: {
                            each: 0.2,
                            from: "center"
                        },
                        yoyo: true
                    })
                    .fromTo(this.elements.circles, {
                        scale: 0,
                    }, {
                        scale: 1,
                    }, '<')
                break;

            case 'connect':
                tl
                    .fromTo(this.elements.circles, {
                        scale: 0,
                    }, {
                        scale: 1,
                        stagger: {
                            each: 0.05,
                            from: "random"
                        },
                    })
                    .fromTo(this.elements.rects, {
                        scale: 0,
                    }, {
                        scale: 1,
                        stagger: {
                            each: 0.05,
                            from: "start"
                        },
                        yoyo: true
                    })
                break;
        }

        return tl;
    }

    create() {
        if (gsap.reduced) return;
        this.#tl = this.createTimeline();
        computeParams(this.element, this.getBaseConfig());
    }

    getBaseConfig() {
        return {
            ease: easeInstant,
            duration: 0.8,
        };
    }

    isIn = () => {
        if (gsap.reduced || !this.#tl) return;
        this.element.classList.add("is-inview");
        this.#tl.restart();
    };

    isOut = () => {
        if (gsap.reduced) return;
        this.element.classList.remove("is-inview");
        if (this.#tl) {
            this.#tl.progress(0).pause();
        }
        switch (this.shapeType) {
            case 'connect':
                gsap.set([this.elements.rects, this.elements.circles], {
                    scale: 0
                });
                break;
            case 'crafted':
                gsap.set(this.elements.circles, {
                    scale: 0
                });
                gsap.set(this.elements.paths, {
                    drawSVG: '0% 0%'
                });
                break;
            case 'power':
                gsap.set(this.elements.paths, {
                    drawSVG: '0% 0%'
                });
                break;
            case 'hero':
                gsap.set(this.elements.groups, {
                    scale: 0,
                    drawSVG: '100% 100%'
                });
                break;
        }
    };

    destroy() {
        if (this.#tl) {
            this.#tl.kill();
            this.#tl = null;
        }

        // Reset SVG elements to initial state
        switch (this.shapeType) {
            case 'connect':
                gsap.set([this.elements.rects, this.elements.circles], {
                    clearProps: "all"
                });
                break;
            case 'crafted':
                gsap.set(this.elements.circles, {
                    clearProps: "all"
                });
                gsap.set(this.elements.paths, {
                    clearProps: "all"
                });
                break;
            case 'power':
                gsap.set(this.elements.paths, {
                    clearProps: "all"
                });
                gsap.set(this.elements.circles, {
                    clearProps: "all"
                });
                break;
            case 'hero':
                gsap.set(this.elements.groups, {
                    clearProps: "all"
                });
                gsap.set(this.elements.circles, {
                    clearProps: "all"
                });
                break;
        }

        this.element.classList.remove("is-inview");
    }

}