import {
    Observe
} from "./_/observe";
import gsap from 'gsap'
import {
    html
} from '@/utils/environment';

let currentOpenAccordion = null;

export class Accordion extends Observe {
    constructor(element) {
        super(element);

        // DOM 
        this.$details = element;

        // Binding
        this.onClickBind = this.onClick.bind(this);

        // Data
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
    }

    init() {
        // UI
        this.$summary = this.$details.querySelector("summary");
        this.$content = this.$details.querySelector(".accordion__content");
        this.bindEvents();

        // Close if another accordion is open
        if (currentOpenAccordion && currentOpenAccordion !== this && this.$details.open) {
            this.shrink();
        }
    }

    destroy() {
        super.destroy();

        // this.unbindEvents();
    }

    bindEvents() {
        this.$summary.addEventListener("click", this.onClickBind);
    }

    unbindEvents() {
        this.$summary.removeEventListener("click", this.onClickBind);
    }

    onClick(e) {
        e.preventDefault();

        this.$details.style.overflow = "hidden";

        if (this.isClosing || !this.$details.open) {
            this.open();
        } else if (this.isExpanding || this.$details.open) {
            this.shrink();
        }
    }

    getElementHeightWithMargins(element) {
        const style = window.getComputedStyle(element);
        const marginTop = parseFloat(style.marginTop);
        const marginBottom = parseFloat(style.marginBottom);
        return element.offsetHeight + marginTop + marginBottom;
    }


    shrink() {
        if (this.isClosing || !this.$details.open) return;

        this.isClosing = true;
        this.$details.classList.remove("is-active");

        const startHeight = `${this.getElementHeightWithMargins(this.$details)}px`;
        const endHeight = `${this.getElementHeightWithMargins(this.$summary)}px`;

        if (this.animation) this.animation.cancel();

        this.animation = this.$details.animate({
            height: [startHeight, endHeight]
        }, {
            duration: 300,
            easing: "cubic-bezier(0.165, 0.840, 0.440, 1.000)"
        });

        this.animation.onfinish = () => {
            this.onAnimationFinish(false);
            if (currentOpenAccordion === this) currentOpenAccordion = null;
        };

        this.animation.oncancel = () => {
            this.isClosing = false;
            this.$details.classList.add("is-active");
        };

        this.onShrink ? .(this.$details);

        this.$details.setAttribute('aria-expanded', false);
        this.$summary.setAttribute('aria-controls', this.$content.id);
    }

    open() {
        if (currentOpenAccordion && currentOpenAccordion !== this) {
            currentOpenAccordion.shrink();
        }

        this.$details.style.height = `${this.$details.offsetHeight}px`;
        this.$details.open = true;
        window.requestAnimationFrame(() => this.expand());
        currentOpenAccordion = this;

        this.onOpen ? .(this.$details);

        this.$details.setAttribute('aria-expanded', true);
        this.$summary.setAttribute('aria-controls', this.$content.id);

    }


    expand() {
        this.isExpanding = true;
        this.$details.classList.add("is-active");

        if (this.$parent) this.$parent.classList.add("is-active");

        // const startHeight = `${this.$details.offsetHeight}px`;
        // const endHeight = `${this.$summary.offsetHeight + this.$content.offsetHeight}px`;

        const startHeight = `${this.getElementHeightWithMargins(this.$details)}px`;
        const endHeight = `${this.getElementHeightWithMargins(this.$summary) + this.getElementHeightWithMargins(this.$content)}px`;

        if (this.animation) {
            this.animation.cancel();
        }

        this.animation = this.$details.animate({
            height: [startHeight, endHeight],
        }, {
            duration: 300,
            easing: "cubic-bezier(0.165, 0.840, 0.440, 1.000)",
        });

        this.animation.onfinish = () => this.onAnimationFinish(true);
        this.animation.oncancel = () => {
            this.isExpanding = false;
            this.$details.classList.remove("is-active");
        };
    }


    onAnimationFinish(open) {
        this.$details.open = open;
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.$details.style.height = this.$details.style.overflow = "";

        if (!open && currentOpenAccordion === this) {
            currentOpenAccordion = null;
        }
    }

    setCallbacks({
        onOpen = () => {},
        onShrink = () => {}
    }) {
        this.onOpen = onOpen;
        this.onShrink = onShrink;
    }
}