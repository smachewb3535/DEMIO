import * as THREE from 'three'

import Gl from '../../../Gl'

export default class Mouse {
    constructor() {
        this.gl = new Gl()

        this.mouseMoved = false
        this.touching = false
        this.previousTouching = false
        this.coords = new THREE.Vector2()
        this.coords_old = new THREE.Vector2()
        this.diff = new THREE.Vector2()
        this.timer = null
        this.count = 0
    }

    init() {
        document.body.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
        document.body.addEventListener('touchstart', this.onDocumentTouchStart.bind(this), false)
        document.body.addEventListener('touchend', this.onDocumentTouchEnd.bind(this), false)
        document.body.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), false)
    }

    setCoords(x, y) {
        if (this.timer) clearTimeout(this.timer)
        this.coords.set(x, y)

        this.mouseMoved = true
        this.timer = setTimeout(() => {
            this.mouseMoved = false
        }, 100)
    }

    onDocumentMouseMove(event) {
        this.setCoords(this.gl.mouse.normalized.current.x, this.gl.mouse.normalized.current.y)
    }

    onDocumentTouchStart(event) {
        this.touching = true
    }

    onDocumentTouchEnd(event) {
        this.touching = false
    }

    onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            // event.preventDefault();

            this.setCoords(this.gl.mouse.normalized.current.x, this.gl.mouse.normalized.current.y)
        }
    }

    update() {
        /* 
          Touch
        */
        if (this.touching != this.previousTouching) {
            // Reset touch when started to prevent
            if (this.touching) {
                this.coords.copy(this.gl.mouse.normalized.current)
                this.coords_old.copy(this.gl.mouse.normalized.current)
            }
        }

        /* 
          Calculate diff
        */
        this.diff.subVectors(this.coords, this.coords_old)

        this.coords_old.copy(this.coords)

        if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0)

        this.previousTouching = this.touching
    }
}