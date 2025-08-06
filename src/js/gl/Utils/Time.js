import EventEmitter from './EventEmitter.js'
import {
    Clock
} from 'three'

export default class Time extends EventEmitter {
    constructor() {
        super()

        // Setup
        this.clock = new Clock()
        this.elapsed = 0
        this.delta = 0

        window.requestAnimationFrame(() => {
            this.tick()
        })
    }

    tick() {
        this.delta = Math.min(this.clock.getDelta(), 1 / 30) * 100 // Prevent long frame jump when tab change in browser - limited to 30fps
        this.elapsed = this.clock.getElapsedTime()

        this.trigger('tick')

        window.requestAnimationFrame(() => {
            this.tick()
        })
    }
}