import gsap, {
    ScrollTrigger
} from "@/gsap"
import Hey from '../utils/hey'

export class Progress {
    constructor() {
        // console.log("Progress");
        if (Hey.PAGE_SLUG != '/') return


        // this.init();
    }

    init() {
        this.sections = gsap.utils.toArray('.s');
        this.sectionsButFirst = document.querySelectorAll('.s:not(.is--hero)');
        this.sectionTitles = document.querySelectorAll('.section__title')
        this.sectionDescs = document.querySelectorAll('.section__desc')
        this.sectionDescsButFirst = document.querySelectorAll('.s:not(.is--hero) .section__desc');

        gsap.set(this.sectionDescs, {
            "--progress": 0
        });
        gsap.set(this.sections, {
            autoAlpha: 1,
            position: "absolute",
            top: 0,
            left: 0
        });

        if (!this.sections.length) return;
        this.createScrollTimeline();
    }

    createScrollTimeline() {
        // console.log("createScrollTimeline");

        this.infinite = false;
        this.once = false;
        this.scrollFactor = 2;
        this.titleDuration = 1;
        this.fadeOutDuration = 0.5;
        this.descOffset = 0;

        this.sectionConfig = [{
                duration: 0.5 * this.scrollFactor,
                offset: "top",
                reference: "50%",
                titleReference: "80%",
                titleDuration: this.titleDuration / 2
            },
            {
                duration: 0.75 * this.scrollFactor,
                offset: "top",
                reference: "65%",
                titleReference: "100%",
                titleDuration: this.titleDuration / 1.5
            },
            {
                duration: 1.5 * this.scrollFactor,
                offset: "top",
                reference: "125%",
                titleReference: "200%",
                titleDuration: this.titleDuration
            },
            {
                duration: 1.0 * this.scrollFactor,
                offset: "top",
                reference: "200%",
                titleReference: "250%",
                titleDuration: this.titleDuration
            },
            {
                duration: 1.0 * this.scrollFactor,
                offset: "top",
                reference: "200%",
                titleReference: "200%",
                titleDuration: this.titleDuration,
                isLastSection: true
            }
        ];

        let cumulativeOffset = 0;
        const lastSection = this.sections[this.sections.length - 1];
        const lastSectionTitle = lastSection.querySelector('.section__title');

        this.initializeFirstSection();

        this.sections.forEach((section, i) => {
            const next = this.sections[i + 1];
            const config = this.sectionConfig[i];

            if (next) {
                cumulativeOffset += config.duration;
                this.createTitleTransition(section, next, config, cumulativeOffset, i, lastSectionTitle);
                this.createDescriptionTransition(section, next, config, cumulativeOffset, i);
            }
        });

        this.createFinalFadeOut(cumulativeOffset, lastSectionTitle);
        this.createMainPin(cumulativeOffset);
    }

    initializeFirstSection() {
        const firstSection = this.sections[0];
        const firstTitle = firstSection.querySelector('.section__title');
        const firstDesc = firstSection.querySelector('.section__desc');
        const firstSectionTL = gsap.timeline({
            defaults: {
                duration: 2
            }
        })
        if (firstTitle) {
            firstSectionTL.to(firstTitle, {
                "--progress": 1
            });
        }
        if (firstDesc) {
            firstSectionTL.to(firstDesc, {
                "--progress": 1,
                autoAlpha: 1
            }, "<");
        }
    }

    createTitleTransition(section, next, config, cumulativeOffset, index, lastSectionTitle) {
        const currentTitle = section.querySelector('.section__title');
        const nextTitle = next.querySelector('.section__title');

        if (!currentTitle || !nextTitle) return;

        this.titleTL = gsap.timeline({
            onStart: () => {
                gsap.set(lastSectionTitle, {
                    "--progress": 0,
                    autoAlpha: 1
                });
                gsap.set(this.sectionDescsButFirst, {
                    "--progress": 0,
                    autoAlpha: 1
                });
            },
            scrollTrigger: {
                trigger: "main",
                start: `${config.offset}+=${100 * cumulativeOffset}% ${config.reference}`,
                end: `${config.offset}+=${100 * (cumulativeOffset + config.titleDuration)}% ${config.titleReference}`,
                scrub: 1,
                id: `title-${index}`,
                invalidateOnRefresh: true
            }
        });

        this.titleTL.to(currentTitle, {
            autoAlpha: 0,
            ease: "none",
        });

        this.titleTL.fromTo(nextTitle, {
                "--progress": 0
            }, {
                "--progress": 1,
                ease: "none"
            },
            ">"
        );
    }

    createDescriptionTransition(section, next, config, cumulativeOffset, index) {
        const currentDesc = section.querySelector('.section__desc');
        const nextDesc = next.querySelector('.section__desc');

        const descStartOffset = cumulativeOffset + this.descOffset;
        const descEndOffset = descStartOffset + config.titleDuration;

        if (currentDesc) {
            gsap.timeline({
                scrollTrigger: {
                    trigger: "main",
                    start: `${config.offset}+=${100 * descStartOffset}% ${config.reference}`,
                    end: `${config.offset}+=${100 * (descStartOffset)}% ${config.reference}`,
                    // end: `${config.offset}+=${100 * (descStartOffset + 0.3)}% ${config.reference}`,
                    scrub: 1,
                    id: `desc-out-${index}`,
                    invalidateOnRefresh: true,
                    // markers: true
                }
            }).to(currentDesc, {
                "--progress": 0,
                ease: "none",
            });
        }

        if (nextDesc) {
            gsap.timeline({
                scrollTrigger: {
                    trigger: "main",
                    // start: `${config.offset}+=${100 * (descStartOffset)}% ${config.reference}`,
                    start: `${config.offset}+=${100 * (descStartOffset + 0.2)}% ${config.reference}`,
                    end: `${config.offset}+=${100 * descEndOffset}% ${config.titleReference}`,
                    scrub: 1,
                    id: `desc-in-${index}`,
                    invalidateOnRefresh: true,
                    // markers: true
                }
            }).fromTo(nextDesc, {
                "--progress": 0
            }, {
                "--progress": 1,
                ease: "none"
            });
        }
    }

    createFinalFadeOut(cumulativeOffset, lastSectionTitle) {
        const totalScrollUnits = this.sectionConfig.reduce((sum, cfg) => sum + cfg.duration, 0);
        const fadeStart = totalScrollUnits;
        const fadeEnd = totalScrollUnits + this.fadeOutDuration;

        const fadeTL = gsap.timeline({
            scrollTrigger: {
                trigger: "main",
                start: `top+=${100 * fadeStart}% 80%`,
                end: `top+=${100 * fadeEnd}% 50%`,
                scrub: true,
                invalidateOnRefresh: true,
                id: "last-section-fade",
                onEnterBack: () => {
                    if (!this.once) {
                        gsap.to(lastSectionTitle, {
                            autoAlpha: 1,
                            duration: this.fadeOutDuration,
                            ease: "none",
                        });
                    }
                },
                onLeave: () => {
                    gsap.set(lastSectionTitle, {
                        "--progress": 0,
                        autoAlpha: 0
                    })
                    gsap.set(this.sectionDescsButFirst, {
                        "--progress": 0,
                        autoAlpha: 0
                    })
                },
                onLeaveBack: () => {
                    this.once = false;
                }
            }
        });

        fadeTL.to(lastSectionTitle, {
            "--progress": 0,
            duration: this.fadeOutDuration,
            ease: "none",
        });

        const lastDesc = this.sections[this.sections.length - 1].querySelector('.section__desc');
        if (lastDesc) {
            fadeTL.to(lastDesc, {
                "--progress": 0,
                duration: this.fadeOutDuration,
                ease: "none",
            }, "<");
        }
    }

    createMainPin(cumulativeOffset) {
        const totalScrollUnits = this.sectionConfig.reduce((sum, cfg) => sum + cfg.duration, 0);
        const fadeEnd = totalScrollUnits + this.fadeOutDuration;

        ScrollTrigger.create({
            trigger: "main",
            pin: true,
            end: `+=${100 * fadeEnd}%`,
            onUpdate: (self) => {
                if (self.progress.toFixed(3) >= 0.990) {
                    this.once = true;
                }
            },
        });
    }

    destroy() {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
}