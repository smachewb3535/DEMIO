export default class Sizes {
    constructor() {
        // Setup
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 1.5)
        this.aspect = this.width / this.height
    }

    resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 1.5)
        this.aspect = this.width / this.height
    }
}