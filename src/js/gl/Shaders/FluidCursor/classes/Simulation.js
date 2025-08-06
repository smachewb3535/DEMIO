import * as THREE from 'three'

import Advection from './Advection'
import ExternalForce from './ExternalForce'
import Viscous from './Viscous'
import Divergence from './Divergence'
import Poisson from './Poisson'
import Pressure from './Pressure'
import Gl from '../../../Gl'

export default class Simulation {
    constructor(props) {
        this.gl = new Gl()

        this.props = props

        this.fbos = {
            vel_0: null,
            vel_1: null,

            // for calc next velocity with viscous
            vel_viscous0: null,
            vel_viscous1: null,

            // for calc pressure
            div: null,

            // for calc poisson equation
            pressure_0: null,
            pressure_1: null,
        }

        this.options = {
            iterations_poisson: 2,
            iterations_viscous: 2,
            dissipation: 0.96,
            mouse_force: 50,
            resolution: 0.075,
            cursor_size: 10,
            straightness: 1.0,
            viscous: 30,
            isBounce: false,
            dt: 0.014,
            isViscous: false,
            BFECC: false,
        }

        // const controls = new Controls(this.options);

        this.fboSize = new THREE.Vector2()
        this.cellScale = new THREE.Vector2()
        this.boundarySpace = new THREE.Vector2()

        this.init()
    }

    init() {
        this.calcSize()
        this.createAllFBO()
        this.createShaderPass()
    }

    createAllFBO() {
        const type = /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType

        for (let key in this.fbos) {
            this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
                type: type,
            })
        }
    }

    createShaderPass() {
        this.advection = new Advection({
            cellScale: this.cellScale,
            fboSize: this.fboSize,
            dt: this.options.dt,
            src: this.fbos.vel_0,
            dst: this.fbos.vel_1,
            dissipation: this.options.dissipation,
        })

        this.externalForce = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        })

        this.viscous = new Viscous({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            viscous: this.options.viscous,
            src: this.fbos.vel_1,
            dst: this.fbos.vel_viscous1,
            dst_: this.fbos.vel_viscous0,
            dt: this.options.dt,
        })

        this.divergence = new Divergence({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.vel_viscous0,
            dst: this.fbos.div,
            dt: this.options.dt,
        })

        this.poisson = new Poisson({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            straightness: this.options.straightness,
            src: this.fbos.div,
            dst: this.fbos.pressure_1,
            dst_: this.fbos.pressure_0,
        })

        this.pressure = new Pressure({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src_p: this.fbos.pressure_0,
            src_v: this.fbos.vel_viscous0,
            dst: this.fbos.vel_0,
            dt: this.options.dt,
        })
    }

    calcSize() {
        const width = Math.round(this.options.resolution * this.gl.sizes.width)
        const height = Math.round(this.options.resolution * this.gl.sizes.height)

        let px_x = 1.0 / width
        let px_y = 1.0 / height

        if (width > 1100 * this.options.resolution) {
            px_x *= width / (1100 * this.options.resolution)
            px_y *= width / (1100 * this.options.resolution)
        } else {
            const slowedScale = 1 - (1 - width / (1100 * this.options.resolution)) * 0.5

            px_x *= slowedScale
            px_y *= slowedScale
        }

        this.cellScale.set(px_x, px_y)
        this.fboSize.set(width, height)
    }

    resize() {
        this.calcSize()

        for (let key in this.fbos) {
            this.fbos[key].setSize(this.fboSize.x, this.fboSize.y)
        }
    }

    update() {
        if (this.options.isBounce) {
            this.boundarySpace.set(0, 0)
        } else {
            this.boundarySpace.copy(this.cellScale)
        }

        this.advection.update(this.options)

        this.externalForce.update({
            cursor_size: this.options.cursor_size,
            mouse_force: this.options.mouse_force,
            cellScale: this.cellScale,
        })

        let vel = this.fbos.vel_1

        if (this.options.isViscous) {
            vel = this.viscous.update({
                viscous: this.options.viscous,
                iterations: this.options.iterations_viscous,
                dt: this.options.dt,
            })
        }

        this.divergence.update({
            vel
        })

        const pressure = this.poisson.update({
            iterations: this.options.iterations_poisson,
        })

        this.pressure.update({
            vel,
            pressure
        })
    }
}