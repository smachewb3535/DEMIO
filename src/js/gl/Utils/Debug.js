import {
    GUI
} from 'three/addons/libs/lil-gui.module.min.js'
// import Stats from 'three/addons/libs/stats.module.js'
import Stats from 'stats-gl'

import Gl from '../Gl'

export default class Debug {
    constructor() {
        this.gl = new Gl()

        // // // // // // // // // // // // // // // // // // // // //
        // DAT GUI
        this.gui = new GUI({
            width: 300,
            title: 'Settings',
        })
        this.gui.close()
        this.gui.domElement.style.pointerEvents = 'all'

        this.uiFolder = this.gui.addFolder('UI').close()

        this.isHoveringGUI = false

        // // // // // // // // // // // // // // // // // // // // //
        // FPS
        this.stats = new Stats({
            trackGPU: true,
            // trackHz: true,
        })
        this.stats.init(this.gl.renderer.instance)
        document.body.appendChild(this.stats.dom)

        /*
          Functions
        */
        // this.hideUI()
        this.hideProjectedPoints()
        this.setHoveringGUI()
        this.addFleetTelematicsToggle()
    }

    setHoveringGUI() {
        this.gui.domElement.addEventListener('mouseenter', () => {
            this.isHoveringGUI = true
        })

        this.gui.domElement.addEventListener('mouseleave', () => {
            this.isHoveringGUI = false
        })
    }

    hideProjectedPoints() {
        this.uiFolder
            .add({
                value: false
            }, 'value')
            .name('Hide Projected Points')
            .onChange((_value) => {
                document.querySelectorAll('.gl__projected-point').forEach((_el) => {
                    _el.style.display = _value ? 'none' : 'block'
                })
            })
    }

    hideUI() {
        const ui = []

        const nav = document.querySelector('nav')
        if (nav) {
            nav.style.visibility = 'hidden'
            ui.push(nav)
        }

        const modal = document.querySelector('[data-ai="w"]')
        if (modal) {
            modal.style.visibility = 'hidden'
            ui.push(modal)
        }

        const main = document.querySelector('.main-wrapper')
        if (main) {
            main.style.visibility = 'hidden'
            ui.push(main)
        }

        this.uiFolder
            .add({
                value: true
            }, 'value')
            .name('Hide UI')
            .onChange((_value) => {
                ui.forEach((_el) => {
                    _el.style.visibility = _value ? 'hidden' : 'visible'
                })
            })
    }

    addFleetTelematicsToggle() {
        this.uiFolder
            .add({
                value: true
            }, 'value')
            .name('Fleet Telemetrics')
            .onChange((_value) => {
                // Fleet Telemetrics is now always enabled
                console.log('Fleet Telemetrics is always active in this version')
            })
    }

    update() {
        this.stats.update()
    }
}