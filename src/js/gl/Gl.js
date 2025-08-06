import * as THREE from 'three'

import {
    Resize
} from '@/utils/subscribable'
import {
    Raf
} from '@/utils/subscribable'

import Renderer from './Renderer'

import World from './World/World'

import Audio from './Audio/Audio'

import Time from './Utils/Time'
import Sizes from './Utils/Sizes'
import Debug from './Utils/Debug'
import Mouse from './Utils/Mouse'
import ShaderChunks from './Utils/ShaderChunks'

import Assets from './Assets/Assets'

let instance = null

export default class Gl {
    constructor(_params) {
        /* 
          Singleton
        */
        if (instance) {
            return instance
        }

        instance = this

        /* 
          Get Debug 
        */
        this.urlParams = new URLSearchParams(window.location.search)
        this.isDebug = this.urlParams.has('debug')

        /* 
          Params
        */
        this.params = _params

        /* 
          Flags
        */
        this.isLoaded = false

        /* 
          Canvas
        */
        this.canvas = document.querySelector(this.params.canvas)

        /* 
          Audio
        */
        this.audio = new Audio()

        /* 
          Utils
        */
        this.time = new Time()
        this.sizes = new Sizes()
        this.mouse = new Mouse()
        this.shaderChunks = new ShaderChunks()

        /* 
          Renderer
        */
        this.renderer = new Renderer()

        /* 
          Scene & Camera
        */
        this.scene = new THREE.Scene()
        this.camera = new THREE.Camera()

        /* 
          Assets
        */
        this.assets = new Assets()

        /* 
          Resize
        */
        Resize.subscribe(this.resize.bind(this))
    }

    init(_initScene) {
        if (this.isDebug) this.debug = new Debug()

        this.world = new World({
            initScene: _initScene,
        })

        Raf.subscribe(() => {
            this.update()
        })

        this.isLoaded = true

        this.audio.init()

        this.resize()
    }

    load() {
        this.addRenderer()

        return new Promise((_resolve) => {
            Promise.all([this.assets.load()]).then(() => {
                _resolve()
            })
        })
    }

    loadDOM() {
        return new Promise((_resolve) => {
            if (document.readyState === 'interactive') {
                console.log('[WebGL] [ █ █         ] -', 'DOM loaded')

                // this.addRenderer()

                _resolve()
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('[WebGL] [ █ █         ] -', 'DOM loaded')

                    // this.addRenderer()

                    _resolve()
                })
            }
        })
    }

    addRenderer() {}

    update() {
        // this.assets.update()

        if (this.isLoaded) {
            this.renderer.update()
            this.world.update()
            this.mouse.update()
            this.audio.update()

            if (this.isDebug) this.debug.update()
        }
    }

    resize() {
        this.mouse.resize()
        this.sizes.resize()

        if (this.isLoaded) {
            this.renderer.resize()
            this.world.resize()
        }
    }
}