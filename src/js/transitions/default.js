import {
    Pages
} from '../pages'
import gsap, {
    easeGentleIn
} from '@/gsap'
import Gl from '@/gl/Gl'
import {
    Progress
} from '@/modules/progress'
import {
    Translink
} from '@/modules/Translink'
import {
    Modal
} from '@/modules/Modal'
import {
    Menu
} from '@/modules/menu'
import {
    AudioToggler
} from '@/modules/AudioToggler'
import {
    Shapes
} from '@/modules/shapes'
import {
    isMobile
} from '@/utils/media'
import ScrollController from '@/modules/ScrollController'

// function nextTick() {
//   return new Promise((resolve) => requestAnimationFrame(resolve));
// }

export class Transition {
    constructor({
        wrapper
    }) {
        this.wrapper = wrapper
        this.gl = new Gl()
        this.progress = new Progress()
        this.shapesInstances = []
    }

    leave(props) {
        return new Promise((resolve) => {
            this.onLeave({ ...props,
                done: resolve
            })
        })
    }

    enter(props) {
        return new Promise((resolve) => {
            this.onEnter({ ...props,
                done: resolve
            })
        })
    }

    async onLeave({
        from,
        done
    }) {
        ScrollController.isTransitioning = true

        await Pages.transitionOut(from)
        // this.gl.audio.animateAudioOut();
        // this.gl.audio.toggleGlobalVolume(0);

        if (from.dataset.page === 'homepage') {
            await this.cleanupTranslink()
            this.progress ? .destroy ? .()
            Modal.instance ? .destroy ? .()

            gsap.to('.indicator-w', {
                autoAlpha: 0,
                yPercent: 100,
            })

            this.shapesInstances.forEach((instance) => instance.destroy())
            this.shapesInstances = []
        }

        Menu.instance ? .destroy ? .()

        await gsap.to(this.wrapper, {
            autoAlpha: 0,
            duration: 0.3,
            ease: 'power1.inOut',
        })

        done()
    }

    async onEnter({
        to,
        done
    }) {
        await Pages.transitionIn(to)

        if (AudioToggler.instance) {
            // this.gl.audio.animateAudioIn();
            // this.gl.audio.toggleGlobalVolume(0.2);
            AudioToggler.instance.resumeWave()
        }

        await this.gl.world ? .setActiveSceneAnimated(to.dataset.page)

        if (to.dataset.page !== 'homepage') gsap.set('.indicator-w', {
            autoAlpha: 0
        })
        else {
            if (!isMobile()) gsap.set('.indicator__label', {
                text: '[ discover specs ]'
            })
            else gsap.set('.indicator__label', {
                text: '[ specs ]'
            })
        }

        await gsap.to(this.wrapper, {
            autoAlpha: 1,
            duration: 0.3,
            ease: 'power1.inOut',
            onStart: () => {
                this.animateNavigationIn()
                this.handlePageSpecificEnter(to)
            },
        })

        // await this.animateNavigationIn();
        // await this.handlePageSpecificEnter(to);

        done()

        ScrollController.isTransitioning = false
    }

    async cleanupTranslink() {
        const Translink = Translink.instance
        if (Translink && typeof Translink.destroy === 'function') {
            Translink.destroy()

            const form = Translink.form
            if (form ? .parentElement ? .classList.contains('modal__Translink-w')) {
                const mainContainer = document.querySelector('.main')
                if (mainContainer) mainContainer.appendChild(form)
            }

            if (form) {
                gsap.set(form, {
                    clearProps: 'all',
                    opacity: 1,
                    y: 0,
                    scale: 1,
                })
            }
        }
    }

    async animateNavigationIn() {
        const nav = this.wrapper.querySelector('.navigation-w')
        if (nav) {
            await gsap.to(nav, {
                yPercent: 0,
                opacity: 1,
                duration: 1,
                ease: easeGentleIn,
            })
        }
    }

    async handlePageSpecificEnter(to) {
        const modalElement = document.querySelector("[data-ai='modal']")
        const formExists = document.querySelector("[data-ai='w']")

        if (to.dataset.page === 'homepage') {
            this.progress.init()

            this.shapesInstances.forEach((instance) => instance.destroy())
            this.shapesInstances = []

            document.querySelectorAll('[data-shapes]').forEach((el) => {
                const shape = new Shapes(el)
                shape.init()
                this.shapesInstances.push(shape)
            })

            let Translink = Translink.instance
            if (!Translink) Translink = new Translink()

            if (formExists && modalElement && Translink) {
                Translink.init()
                if (!Modal.instance) new Modal(modalElement, Translink)
            } else {
                console.warn('[Translink] Skipping init() â€“ form, modal or Translink not ready')
            }

            gsap.to('.indicator-w', {
                autoAlpha: 1,
                yPercent: 0,
            })
        }

        if (to.dataset.page === 'specs') {
            gsap.to('.section-w', {
                '--progress': 1,
                duration: 2,
            })
        }

        if (to.dataset.page === 'easter-egg') {
            gsap.to('.s.is--hero', {
                '--progress': 1,
                duration: 2,
            })
        }
    }
}