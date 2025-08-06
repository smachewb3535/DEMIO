import {
    Vector2,
    MathUtils
} from 'three'

import Gl from '../Gl'

export default class Mouse {
    constructor(_dom) {
        this.gl = new Gl()

        /* 
          DOM
        */
        this.dom = _dom ? _dom : document

        /* 
          Flags
        */
        this.isMouseHolding = false
        this.isMouseMoved = false

        /* 
          Sizes
        */
        this.width = this.dom == document ? window.innerWidth : this.dom.offsetWidth
        this.height = this.dom == document ? window.innerHeight : this.dom.offsetHeight

        /* 
          Default
        */
        this.default = new Vector2()

        /* 
          Normalized
        */
        this.normalized = {
            current: new Vector2(),
            previous: new Vector2(),
        }

        /* 
          Direction
        */
        this.direction = new Vector2()

        /* 
          Pace
        */
        this.pace = {
            default: 0,
            separated: new Vector2(),
        }

        this.pace = {
            default: 0,
            separated: new Vector2(),
        }

        /* 
          Drag
        */
        this.drag = {
            start: new Vector2(),
            distance: {
                default: 0,
                separated: new Vector2(),
            },
            side: 'left',
            pace: {
                default: 0,
                separated: new Vector2(),
            },
        }

        // // // // // // // // // // // // // // // //
        // EVENTS

        // Move
        this.dom.addEventListener('mousemove', this.mousemove.bind(this))
        this.dom.addEventListener('touchmove', this.touchmove.bind(this))

        // Down
        this.dom.addEventListener('mousedown', this.down.bind(this))
        this.dom.addEventListener('touchstart', this.down.bind(this))

        // Up
        this.dom.addEventListener('mouseup', this.up.bind(this))
        this.dom.addEventListener('touchend', this.up.bind(this))
    }

    mousemove(_event) {
        if (this.dom == document) {
            this.isMouseMoved = true

            // Set Default
            this.default.x = _event.clientX
            this.default.y = _event.clientY

            // Set Normalized
            this.normalized.current.x = (_event.clientX / this.width) * 2 - 1
            this.normalized.current.y = -(_event.clientY / this.height) * 2 + 1

            // Set Drag
            if (this.isMouseHolding) {
                // Set Drag Distance
                this.drag.distance.default = this.drag.start.distanceTo(this.default)
                this.drag.distance.separated.x = this.default.x - this.drag.start.x
                this.drag.distance.separated.y = this.default.y - this.drag.start.y

                if (this.drag.start.x < this.default.x) {
                    this.drag.side = 'right'
                } else {
                    this.drag.side = 'left'
                }
            }
        } else {
            if (_event.target != this.dom) return

            this.isMouseMoved = true

            // Set Default
            this.default.x = _event.offsetX
            this.default.y = _event.offsetY

            // Set Normalized
            this.normalized.current.x = (_event.offsetX / this.width) * 2 - 1
            this.normalized.current.y = -(_event.offsetY / this.height) * 2 + 1

            // Set Drag
            if (this.isMouseHolding) {
                // Set Drag Distance
                this.drag.distance.default = this.drag.start.distanceTo(this.default)
                this.drag.distance.separated.x = this.default.x - this.drag.start.x
                this.drag.distance.separated.y = this.default.y - this.drag.start.y

                if (this.drag.start.x < this.default.x) {
                    this.drag.side = 'right'
                } else {
                    this.drag.side = 'left'
                }
            }
        }
    }

    touchmove(_event) {
        if (_event.touches) {
            this.isMouseMoved = true

            // Set Default
            this.default.x = _event.touches[0].clientX
            this.default.y = _event.touches[0].clientY

            // Set Normalized
            this.normalized.current.x = (_event.touches[0].clientX / this.width) * 2 - 1
            this.normalized.current.y = -(_event.touches[0].clientY / this.height) * 2 + 1

            // Set Drag
            if (this.isMouseHolding) {
                // Set Drag Distance
                this.drag.distance.default = this.drag.start.distanceTo(this.default)
                this.drag.distance.separated.x = this.default.x - this.drag.start.x
                this.drag.distance.separated.y = this.default.y - this.drag.start.y

                if (this.drag.start.x < this.default.x) {
                    this.drag.side = 'right'
                } else {
                    this.drag.side = 'left'
                }
            }
        }
    }

    down(_event) {
        this.isMouseHolding = true

        // Reset Drag Distance
        this.drag.start.copy(this.default)

        // Set for mobile
        if (_event.touches) {
            // Set Normalized
            this.normalized.current.x = (_event.touches[0].pageX / this.width) * 2 - 1
            this.normalized.current.y = -(_event.touches[0].pageY / this.height) * 2 + 1
        }
    }

    up(_event) {
        this.isMouseHolding = false
    }

    resize() {
        this.width = this.dom == document ? window.innerWidth : this.dom.offsetWidth
        this.height = this.dom == document ? window.innerHeight : this.dom.offsetHeight
    }

    update() {
        // Set Normalized Pace
        this.pace.default = this.normalized.current.distanceTo(this.normalized.previous)
        this.pace.separated.x = this.normalized.current.x - this.normalized.previous.x
        this.pace.separated.y = this.normalized.current.y - this.normalized.previous.y

        // Set Normalized Direction
        this.direction.subVectors(this.normalized.current, this.normalized.previous).normalize()

        // Set Drag
        if (this.isMouseHolding) {
            this.drag.pace.default = this.normalized.current.distanceTo(this.normalized.previous)
            this.drag.pace.separated.x = this.normalized.current.x - this.normalized.previous.x
            this.drag.pace.separated.y = this.normalized.current.y - this.normalized.previous.y
        } else {
            this.drag.pace.default = 0
            this.drag.pace.separated.x = 0
            this.drag.pace.separated.y = 0
        }

        // Set Normalized Previous
        this.normalized.previous.copy(this.normalized.current)
    }

    /* 
      Create Eased Movement
    */
    createEasedMovement(_amount) {
        /* 
          Variables
        */
        let value = new Vector2()

        /* 
          Update
        */
        const update = (_delta) => {
            value.x = MathUtils.damp(value.x, this.default.x, _amount, _delta)
            value.y = MathUtils.damp(value.y, this.default.y, _amount, _delta)
        }

        /* 
          Return
        */

        return {
            value,
            update,
        }
    }

    /* 
      Create Eased Normalized
    */
    createEasedNormalized(_amount) {
        /* 
          Variables
        */
        let value = new Vector2()

        /* 
          Update
        */
        const update = (_delta) => {
            let target = this.normalized.current

            if (this.gl.debug ? .isHoveringGUI) {
                target = this.gl.debug.isHoveringGUI ? {
                    x: 0,
                    y: 0
                } : this.normalized.current
            }

            value.x = MathUtils.damp(value.x, target.x, _amount, _delta)
            value.y = MathUtils.damp(value.y, target.y, _amount, _delta)
        }

        /* 
          Return
        */
        return {
            value,
            update,
        }
    }

    /* 
      Create Direction Pace
    */
    createEasedDirection(_amount) {
        /* 
          Variables
        */
        let value = new Vector2()

        /* 
          Update
        */
        const update = (_delta) => {
            value.x = MathUtils.damp(value.x, this.direction.x, _amount, _delta)
            value.y = MathUtils.damp(value.y, this.direction.y, _amount, _delta)
        }

        /* 
          Return
        */
        return {
            value,
            update,
        }
    }

    /* 
      Create Eased Pace
    */
    createEasedPace(_amount) {
        /* 
          Variables
        */
        let value = {
            default: 0,
            separated: new Vector2(),
        }

        /* 
          Update
        */
        const update = (_delta) => {
            value.default = MathUtils.damp(value.default, this.pace.default, _amount, _delta)

            value.separated.x = MathUtils.damp(value.separated.x, this.pace.separated.x, _amount, _delta)
            value.separated.y = MathUtils.damp(value.separated.y, this.pace.separated.y, _amount, _delta)
        }

        /* 
          Return
        */
        return {
            value,
            update,
        }
    }

    /* 
      Create Eased Drag
    */
    createEasedDrag(_amount) {
        /* 
          Variables
        */
        let value = {
            distance: 0,
            pace: {
                default: 0,
                separated: new Vector2(),
            },
        }

        /* 
          Update
        */
        const update = (_delta) => {
            value.distance = MathUtils.damp(value.distance, this.drag.distance, _amount, _delta)

            value.pace.default = MathUtils.damp(value.pace.default, this.drag.pace.default, _amount, _delta)
            value.pace.separated.x = MathUtils.damp(value.pace.separated.x, this.drag.pace.separated.x, _amount, _delta)
            value.pace.separated.y = MathUtils.damp(value.pace.separated.y, this.drag.pace.separated.y, _amount, _delta)
        }

        /* 
          Return
        */
        return {
            value,
            update,
        }
    }
}