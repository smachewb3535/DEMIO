import * as THREE from 'three'

import Gl from './Gl'

export default class Rendered {
    constructor() {
        this.gl = new Gl()

        this.instance = new THREE.WebGLRenderer({
            // canvas: this.gl.canvas,
            powerPreference: 'high-performance',
            // alpha: true,
            // antialias: true,
            precision: 'lowp',
        })

        this.instance.autoClear = false
        this.instance.setPixelRatio(this.gl.sizes.pixelRatio)
        this.instance.setSize(this.gl.sizes.width, this.gl.sizes.height)
        // this.instance.toneMapping = THREE.CineonToneMapping
        // this.instance.toneMappingExposure = 1
        this.instance.physicallyCorrectLights = true
        this.gl.canvas.appendChild(this.instance.domElement)
    }

    update() {
        for (const key in this.gl.world.scenes) {
            this.gl.world.scenes[key].renderPipeline()

            this.instance.clear()
        }

        // // // // // // // // // //
        this.instance.setRenderTarget(null)
        this.instance.render(this.gl.scene, this.gl.camera)
    }

    resize() {
        this.instance.setPixelRatio(this.gl.sizes.pixelRatio)
        this.instance.setSize(this.gl.sizes.width, this.gl.sizes.height)
    }
}