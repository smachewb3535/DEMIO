import TagCloud from "TagCloud";

export class Tags {
    constructor(selector, tags, options = {}) {
        this.selector = selector;
        this.tags = tags;
        this.baseOptions = options;
        this.instance = null;

        this.selector = '.tagcloud-w';

        this.baseOptions = {
            radius: 336,
            maxSpeed: "normal",
            initSpeed: "fast",
            direction: 135,
            keep: false
            //  useItemInlineStyles: true // Make sure this is true
        };

        this.tags = [
            // "[      USB-C universal charging      ]",
            "[      EQualizer      ]",
            "[      noise control      ]",
            "[      AI assistant      ]"
        ];


        this.init();
        this.addListeners();
    }
    getResponsiveRadius() {
        const {
            baseViewport = 1440, baseRadius = 400, minRadius = 150
        } = this.baseOptions;
        const currentViewport = window.innerWidth;

        return Math.max(minRadius, (currentViewport / baseViewport) * baseRadius);
    }

    init() {
        const radius = this.getResponsiveRadius();
        this.instance = new TagCloud(this.selector, this.tags, {
            ...this.baseOptions,
            radius: radius
        });

    }

    update() {
        if (this.instance) {
            if (Array.isArray(this.instance)) {
                this.instance.forEach(cloud => cloud.destroy());
            } else {
                // NEED TO FIX THTA
                // this.instance.destroy();
            }
        }
        this.init();
    }

    addListeners() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.update(), 200);
        });
    }

}