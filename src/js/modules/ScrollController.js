import {
    Scroll
} from '../scroll'
import Gl from '../gl/Gl'
import {
    Raf
} from '@/utils/subscribable'
import {
    damp
} from 'three/src/math/MathUtils.js'

class _ScrollController {
    constructor() {
        /* 
          Flags
        */
        this.isTransitioning = false
        this.isIdleScrollAllowed = true
        this.isBackwardLoopingAllowed = false

        /* 
          Velocity  
        */

        // Mouse Wheel
        this.velocity = 0
        this.previousVelocity = 0
        this.easedVelocity = 0

        // Touch Drag
        this.touchDragVelocity = 0
        this.previousTouchDragVelocity = 0
        this.easedTouchDragVelocity = 0

        /* 
          Stops
        */
        this.stops = [0, 0.125, 0.25, 0.375, 0.5, 0.742, 0.81, 1]
        //             100   100   100    100   100   200   100
        // Original: 0, 162, 359, 562, 754, 962
        // Target:   0, 193, 386, 579, 772, 965

        // 0,143

        /* 
          Direction
        */
        this.direction = 0

        /* 
          Params
        */
        this.params = {
            threshold: {
                mouseWheel: 50,
                touchDrag: 50,
            },
        }

        /* 
          Progress
        */
        this.previousScroll = Scroll.progress
        this.nextProgress = Scroll.progress

        /* 
          Events
        */
        document.addEventListener('wheel', this.handleTresholdNudge.bind(this))
    }

    init() {
        /* 
          Scroll to top
        */
        Scroll.scrollTo(0, {
            immediate: true,
            force: true,
            lock: true,
        })

        Scroll.start()

        /* 
          Get Gl
        */
        this.gl = new Gl()

        /* 
          Run functions
        */
        this.setIdleScroll()
        this.setSceneProgress()
        this.update()
    }

    setSceneProgress() {
        Scroll.on('scroll', () => {
            if (ScrollController.isTransitioning) return

            this.gl.world.activeScenes.current.updateScroll(Scroll.progress)

            if (this.gl.world.activeScenes.current.id == 'main-a' || this.gl.world.activeScenes.current.id == 'main-b') {
                this.gl.world.renderPlane.mesh.material.uniforms.uProgress.value = Scroll.progress
            }

            this.handleLoop()

            // Scroll.
        })
    }

    handleLoop() {
        /* 
          Prevent from working on specs and easter-egg scenes
        */
        if (this.gl.world.activeScenes.current.id == 'specs' || this.gl.world.activeScenes.current.id == 'easter-egg' || this.gl.world.activeScenes.current.id == 'fwa') return

        /* 
          Loop forward
        */
        if (Scroll.progress > 0.99 && !this.isTransitioning && Scroll.direction == 1) {
            if (this.gl.isDebug) console.log('Scroll transition: 1')

            this.loopForward()

            this.isBackwardLoopingAllowed = true
        }

        /* 
          Loop backward
        */
        if (Scroll.progress < 0.01) {
            this.isOnEdge = true

            if (!this.isTransitioning && (this.easedVelocity < -this.params.threshold.mouseWheel || this.easedTouchDragVelocity < -this.params.threshold.touchDrag) && Scroll.direction == -1) {
                if (this.gl.isDebug) console.log('Scroll transition: -1')

                this.loopBackward()
            }
        } else {
            this.isOnEdge = false
        }

        // console.log(this.easedVelocity)
    }

    async loopForward() {
        Scroll.stop()
        // Scroll.velocity = 0
        // Scroll.lastVelocity = 0
        // Scroll.targetScroll = 0
        // Scroll.animatedScroll = 0
        // Scroll.time = performance.now()

        this.isTransitioning = true

        let target = this.gl.world.scenes.mainB

        if (this.gl.world.activeScenes.current == this.gl.world.scenes.mainB) {
            target = this.gl.world.scenes.mainA
        }

        await this.gl.world.translateAnimation({
            direction: 1,
            target: target,
            animateTargetScene: true,
            animatePreviousScene: true,
        })

        this.isTransitioning = false
    }

    async loopBackward() {
        // Scroll.stop()

        this.isTransitioning = true

        await this.gl.world.translateAnimation({
            direction: -1,
        })

        this.isTransitioning = false

        Scroll.start()

        Scroll.scrollTo(Scroll.limit, {
            immediate: true,
            force: true,
            lock: true,
        })
    }

    setIdleScroll() {
        const options = {
            easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
        }

        this.scrollTimeout = setTimeout(() => {
            Scroll.scrollTo(this.getSectionAnchor(), options)
        }, 50)

        Scroll.on('scroll', () => {
            clearTimeout(this.scrollTimeout)

            this.scrollTimeout = setTimeout(() => {
                if (this.gl.world.activeScenes.current.id == 'specs' || this.gl.world.activeScenes.current.id == 'easter-egg' || !this.isIdleScrollAllowed) return

                Scroll.scrollTo(this.getSectionAnchor(), options)
            }, 50)
        })
    }

    handleTresholdNudge(_e) {
        this.getScrollVelocity(_e)
        this.getDirection(_e)
        // // Return if transitioning
        // if (this.isTransitioning) return
        // // Forward
        // if (Scroll.isStopped) {
        //   if (this.direction == 1 && !this.isTransitioning) {
        //     Scroll.start()
        //   }
        // }
        // // if (Scroll.progress > 0.9 && Scroll.progress <= 1.0) {
        // //   if (this.easedVelocity > this.params.threshold && this.direction == 1) {
        // //     Scroll.start()
        // //     this.isOnEdge = false
        // //   }
        // //   if (this.direction == -1) {
        // //     Scroll.start()
        // //     this.isOnEdge = false
        // //   }
        // // }
        // if (Scroll.progress < 0.1 && Scroll.progress >= 0.0) {
        //   if (this.easedVelocity < -this.params.threshold && this.direction == -1 && this.isBackwardLoopingAllowed) {
        //     Scroll.start()
        //     this.isOnEdge = false
        //   } else if (this.direction == 1) {
        //     Scroll.start()
        //     this.isOnEdge = false
        //     this.preventScrollUpdate = false
        //   }
        // }
    }

    getSectionAnchor_OLD() {
        // const sectionLength = 7
        // let result = Math.round(Scroll.progress * sectionLength) / sectionLength
        let result = this.findClosestStop(Scroll.progress, this.stops)
        result *= Scroll.limit

        return result
    }

    getSectionAnchor(index) {
        // anchor behovior by index
        if (typeof index !== 'undefined') {
            return this.stops[index] * Scroll.limit
        }
        // Fallback
        let result = this.findClosestStop(Scroll.progress, this.stops)
        result *= Scroll.limit
        return result
    }

    findClosestStop(value, stops) {
        // console.log(value, stops);

        return stops.reduce((prev, curr) => {
            return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        })
    }

    getScrollVelocity(_e) {
        if (!this.isTransitioning && this.isOnEdge && this.isBackwardLoopingAllowed) {
            this.velocity = _e.deltaY - this.previousVelocity
        } else {
            this.velocity = 0
        }
    }

    getDirection(_e) {
        if (_e.deltaY > 0) {
            this.direction = 1
        } else {
            this.direction = -1
        }
    }

    update() {
        Raf.subscribe(() => {
            /* 
              Nudge
            */
            if (this.gl.world.activeScenes.current.id == 'main-a' || this.gl.world.activeScenes.current.id == 'main-b') {
                /* 
                  Scroll Wheel
                */
                this.easedVelocity = damp(this.easedVelocity, this.velocity, 0.025, this.gl.time.delta)

                this.velocity = 0

                this.previousVelocity = this.velocity

                /* 
                  Touch Drag
                */
                if (!this.isTransitioning && this.isOnEdge && this.isBackwardLoopingAllowed) {
                    this.easedTouchDragVelocity = damp(this.easedTouchDragVelocity, this.gl.mouse.drag.distance.separated.y, 0.025, this.gl.time.delta)
                } else {
                    this.easedTouchDragVelocity = damp(this.easedTouchDragVelocity, 0, 0.025, this.gl.time.delta)
                }

                this.gl.mouse.drag.distance.separated.y = 0

                // console.log(this.easedTouchDragVelocity)

                /* 
                  Set Visual Velocity
                */
                this.gl.world.renderPlane.mesh.material.uniforms.uScrollVelocity.value = Math.min(this.easedVelocity, this.easedTouchDragVelocity)
            }
        })
    }
}

const ScrollController = new _ScrollController()

export default ScrollController