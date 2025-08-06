export class Viewport {
    constructor() {
        this.resize();
    }

    resize() {
        document.documentElement.style.setProperty(
            "--vw",
            `${document.documentElement.clientWidth * 0.01}px`
        );
        document.documentElement.style.setProperty(
            "--vh",
            `${document.documentElement.clientHeight * 0.01}px`
        );
    }
}