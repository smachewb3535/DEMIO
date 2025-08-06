// Loader.js

import gsap, {
    reduced,
    easePrimary,
    easeGentleIn,
    easeInstant,
    easeBlur,
    easeDirectional,
    easeMenu,
    easeQuickSnap,
    easeText
} from '@/gsap'
import {
    Progress
} from './progress'
import {
    isMobile
} from '@/utils/media'
import {
    Shapes
} from './shapes'

export default class Loader {
    /**
     * @param {string} page
     */
    constructor(page) {
        this.loaderWrapper = document.querySelector('.loader-w')
        this.loader = document.querySelector('.loader')
        this.circles = gsap.utils.toArray('.loader__circle')
        this.dots = gsap.utils.toArray('.loader__dot')
        this.tags = document.querySelector('.tagcloud-w')
        this.navigation = document.querySelector('.navigation-w')

        this.scrollDown = document.querySelector('.scroll__down')
        this.indicatorWrapper = document.querySelector('.indicator-w')
        this.indicatorIcon = this.indicatorWrapper ? .querySelector('.indicator__icon')
        this.indicatorLabel = this.indicatorWrapper ? .querySelector('.indicator__label')

        this.currentPage = page

        // State for rotation control and outro
        this.rotationCount = 0
        this.minRotations = 1
        this.canResolve = false
        this.outroRequested = false
        this.outroExecuted = false

        // Track GSAP timelines to kill on outro
        this.infiniteAnimation = null

        // For resolving outro promise
        this.outroResolve = null

        this.initPageStates(page)
    }

    initShapesOnHome() {
        document.querySelectorAll('[data-shapes]').forEach((el) => {
            const shape = new Shapes(el)
            shape.init()
            // Store if needed
            this.shapesInstances = this.shapesInstances || []
            this.shapesInstances.push(shape)
        })
    }

    initPageStates(page) {
        if (this.indicatorIcon) gsap.set(this.indicatorIcon, {
            opacity: 0,
            scale: 0
        })
        if (this.tags) gsap.set(this.tags, {
            scale: 0.8,
            filter: 'blur(1rem)',
            opacity: 0
        })
        if (this.navigation) gsap.set(this.navigation, {
            yPercent: -120,
            opacity: 0
        })

        switch (page) {
            case '/':
                this.progressInstance = new Progress()
                this.aiForm = document.querySelector("[data-ai='w']")
                if (this.aiForm) gsap.set(this.aiForm, {
                    opacity: 0
                })
                this.initShapesOnHome()
                break
            case '/preorder':
                this.preorderHeroSection = document.querySelector('.s.is--hero')
                this.preorderWrapper = document.querySelector('.preorder-w')
                if (this.preorderWrapper) {
                    this.preorderChildren = gsap.utils.toArray(this.preorderWrapper.children)
                    gsap.set(this.preorderWrapper, {
                        autoAlpha: 0
                    })
                }
                break
            case '/specs':
                this.specsHeroSection = document.querySelector('.s.is--hero .section-w')
                this.specsWrapper = document.querySelector('.specs-w')
                this.specsCTA = document.querySelector('.specs__cta')
                if (this.specsWrapper) gsap.set(this.specsWrapper, {
                    autoAlpha: 0
                })
                if (this.specsCTA) gsap.set(this.specsCTA, {
                    autoAlpha: 0
                })
                break
            case '/fwa':
                this.specsHeroSection = document.querySelector('.s.is--hero .section-w')
                this.specsWrapper = document.querySelector('.specs-w')
                this.specsCTA = document.querySelector('.specs__cta')
                if (this.specsWrapper) gsap.set(this.specsWrapper, {
                    autoAlpha: 0
                })
                if (this.specsCTA) gsap.set(this.specsCTA, {
                    autoAlpha: 0
                })
                break
        }
    }

    /**
     * Main loader animation sequence.
     * @param {string} page
     * @returns {Promise<void>}
     */
    loaderAnimation(page) {
        return new Promise((resolve, reject) => {
            if (!this.loader || !this.circles.length || !this.dots.length) {
                console.error('Missing loader elements')
                reject('Missing loader elements')
                return
            }

            const mainTl = gsap.timeline({
                onStart: () => {
                    document.documentElement.classList.add('is-loading')
                },
                onComplete: () => {
                    if (!this.outroExecuted) this.createInfiniteRotation()
                    resolve()
                },
            })

            mainTl.add(this.animationIntro())
        })
    }

    /**
     * Loader intro animation (no rotation).
     * @returns {GSAPTimeline}
     */
    animationIntro() {
        const tl = gsap
            .timeline({
                defaults: {
                    ease: easeGentleIn,
                    duration: 1
                }
            })
            .from(this.circles, {
                scale: 0,
                stagger: {
                    each: 0.2,
                    from: 'start'
                },
            })
            .to(this.tags, {
                scale: 1,
                filter: 'blur(0rem)',
                opacity: 1
            }, '<')
            .to(this.dots, {
                opacity: 1,
                stagger: 0.1,
                duration: 0.5
            }, 0)
        return tl
    }

    /**
     * Creates infinite rotation animation for loader circles.
     * Uses onUpdate to allow immediate outro when ready, not just at repeat boundaries.
     */
    createInfiniteRotation() {
        this.rotationCount = 0
        this.infiniteAnimation = gsap.timeline({
            repeat: -1,
            onRepeat: () => {
                this.rotationCount++
                    if (this.rotationCount >= this.minRotations) {
                        this.canResolve = true
                    }
            },
            onUpdate: () => {
                // console.log("[Loader] onUpdate", this.rotationCount, this.minRotations, this.canResolve, this.outroRequested, this.outroExecuted);

                if (this.canResolve && this.outroRequested && !this.outroExecuted) {
                    this.executeOutro()
                }
            },
        })
        this.infiniteAnimation.to(
            this.circles, {
                scale: 1,
                rotationY: '+=360',
                rotationZ: '+=360',
                duration: 3,
                stagger: {
                    each: 0.15,
                    from: 'start'
                },
                ease: easeMenu,
                // ease: easePrimary,
                transformOrigin: 'center center',
            },
            '<'
        )
    }

    /**
     * Triggers the outro animation.
     * @param {string} page
     * @returns {Promise<void>}
     */
    animationOutro(page) {
        this.outroRequested = true
        if (this.canResolve && !this.outroExecuted) {
            this.executeOutro(page)
            return Promise.resolve()
        } else {
            return new Promise((resolve) => {
                this.outroResolve = resolve
            })
        }
    }

    /**
     * Kills all rotation timelines.
     */
    killAllRotations() {
        if (this.infiniteAnimation) {
            this.infiniteAnimation.kill()
            this.infiniteAnimation = null
        }
    }

    /**
     * Executes the outro animation and resolves any pending promises.
     * @param {string} [page]
     * @returns {GSAPTimeline}
     */
    executeOutro(page) {
        this.outroExecuted = true

        const tl = gsap.timeline({
            defaults: {
                ease: 'expo.out',
                duration: 0.8
            },
            onStart: () => {
                gsap.to(this.tags, {
                    scale: 1.1,
                    filter: 'blur(1rem)',
                    opacity: 0
                })
                if (this.outroResolve) {
                    this.outroResolve()
                    this.outroResolve = null
                }
            },
            onComplete: () => {
                document.documentElement.classList.remove('is-loading')
            },
        })

        tl.to(this.circles, {
            opacity: 0,
            filter: 'blur(1rem)',
            stagger: {
                amount: 0.8,
                each: 0.15,
                from: 'start',
            },
            overwrite: 'auto',
            onStart: () => {
                this.killAllRotations()
            },
        })

        const currentPage = page || this.currentPage
        this.animatePageOutro(tl, currentPage)

        return tl
    }

    /**
     * Handles page-specific outro animations.
     * @param {GSAPTimeline} tl
     * @param {string} currentPage
     */
    animatePageOutro(tl, currentPage) {
        switch (currentPage) {
            case '/':
                if (this.aiForm) tl.to(this.aiForm, {
                    opacity: 1
                }, '<')
                this.animateNavigationIn(tl)
                this.animateIndicatorIn(tl)
                if (this.progressInstance)
                    tl.call(
                        () => {
                            this.progressInstance.init()
                        },
                        null,
                        '<'
                    )
                break
            case '/preorder':
                this.animateNavigationIn(tl)
                if (this.preorderHeroSection) tl.to(this.preorderHeroSection, {
                    '--progress': 1,
                    ease: easePrimary,
                    duration: 2
                }, '<')
                if (this.preorderWrapper) tl.to(this.preorderWrapper, {
                    autoAlpha: 1,
                    ease: easePrimary,
                    duration: 0.4
                }, '<')
                if (this.indicatorLabel) tl.to(this.indicatorLabel, {
                    yPercent: 100,
                    autoAlpha: 0,
                    filter: 'blur(1rem)'
                }, '<')
                break
            case '/specs':
                this.animateNavigationIn(tl)
                if (this.specsWrapper) tl.to(this.specsWrapper, {
                    autoAlpha: 1,
                    ease: easePrimary,
                    duration: 1
                }, '<')
                if (this.specsHeroSection) tl.to(this.specsHeroSection, {
                    '--progress': 1,
                    ease: easePrimary,
                    duration: 2
                }, '<')
                if (this.specsCTA) tl.to(this.specsCTA, {
                    autoAlpha: 1,
                    ease: easePrimary,
                    duration: 0.8
                }, '<')
                if (this.indicatorLabel) tl.to(this.indicatorLabel, {
                    yPercent: 100,
                    autoAlpha: 0
                }, '<')
                break
            case '/fwa':
                this.animateNavigationIn(tl)
                if (this.specsWrapper) tl.to(this.specsWrapper, {
                    autoAlpha: 1,
                    ease: easePrimary,
                    duration: 1
                }, '<')
                if (this.specsHeroSection) tl.to(this.specsHeroSection, {
                    '--progress': 1,
                    ease: easePrimary,
                    duration: 2
                }, '<')
                if (this.specsCTA) tl.to(this.specsCTA, {
                    autoAlpha: 1,
                    ease: easePrimary,
                    duration: 0.8
                }, '<')
                if (this.indicatorLabel) tl.to(this.indicatorLabel, {
                    yPercent: 100,
                    autoAlpha: 0
                }, '<')
                break
            default:
                console.warn('Unknown page:', currentPage)
                this.animateNavigationIn(tl)
        }
    }

    /**
     * Animates navigation in.
     * @param {GSAPTimeline} tl
     */
    animateNavigationIn(tl) {
        if (this.navigation) tl.to(this.navigation, {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: easeGentleIn
        }, '<')
    }

    /**
     * Animates indicator in for the home page.
     * @param {GSAPTimeline} tl
     */
    animateIndicatorIn(tl) {
        if (this.indicatorLabel)
            if (!isMobile()) tl.to(this.indicatorLabel, {
                text: '[ discover specs ]'
            }, '<.4')
        else tl.to(this.indicatorLabel, {
            text: '[ specs ]'
        }, '<.4')

        if (this.indicatorIcon) tl.to(this.indicatorIcon, {
            opacity: 1,
            scale: 1
        }, '<.4')
    }
}