import {
    url
} from "./ai/utils/url";
import gsap, {
    Flip,
    easeBlur,
    easeDirectional,
    easeGentleIn,
    easeInstant,
    easePrimary,
} from "@/gsap";
import {
    html
} from "@/utils/environment";
import {
    Modal
} from "./Modal";
import {
    Accordion
} from "./Accordion";
import {
    TranslinkDB
} from "./TranslinkDB";
import Gl from "@/gl/Gl";
import Hey from "../utils/hey";
import {
    isMobile
} from "@/utils/media";
import ScrollController from "./ScrollController";

const CLASS = {
    MODAL_OPEN: `has-modal-open`,
    AI_OPEN: `has-ai-open`,
    AI_THINKING: `has-ai-thinking`,
    AI_RESPONSE: `has-ai-response`,
    AI_ERROR: `has-ai-error`,
};

export class Translink {
    static instance = null;

    constructor() {
        if (Hey.PAGE_SLUG !== "/") return;

        if (Translink.instance) return Translink.instance;
        Translink.instance = this;

        // console.log("Constructing Translink...");
        this.init();
    }

    init() {
        this.form = document.querySelector("[data-ai='w']");
        if (!this.form) {
            console.warn("[Translink] Form not found, skipping init.");
            return;
        }

        this.isAnimating = false;
        this.gl = new Gl();
        this.db = new TranslinkDB(9);

        this.Modal = new Modal(document.querySelector("[data-ai='modal']"), this);
        this.accordions = [];

        this.setupElements();
        this.setupStates();
        this.initEventListeners();
    }

    setupElements() {
        const qs = (s) => this.form.querySelector(`[data-ai='${s}']`);

        this.buttonWrapper = qs("buttonWrapper");
        this.button = qs("button");
        this.buttonInner = qs("buttonInner");
        this.buttonLabel = qs("buttonLabel");
        this.buttonIcon = this.button.querySelector("[data-ai='icon']");
        this.questionWrapper = qs("questionWrapper");
        this.question = qs("question");
        this.closeQuestion = qs("closeQuestion");

        this.responseWrapper = qs("responseWrapper");
        this.response = qs("response");
        this.responseTitle = qs("title");
        this.responseVisual = qs("visual");
        this.responseWrapper.style.display = "none";

        this.CTAs = {
            CTA_1: qs("CTA_1"),
            CTA_2: qs("CTA_2"),
            CTA_3: qs("CTA_3"),
            CTA_4: qs("CTA_4"),
        };
        gsap.set(Object.values(this.CTAs), {
            display: "none"
        });

        this.accordionWrapper = document.querySelector(
            "[data-ai='accordionWrapper']"
        );
        this.$modal = document.querySelector("[data-ai='modal']");
        this.responseModalVisualWrapper = this.$modal.querySelector(
            "[data-ai='modalVisualWrapper']"
        );
        this.responseModalVisual = this.$modal.querySelector(
            "[data-ai='modalVisual']"
        );
        this.responseModalTitle = this.$modal.querySelector(
            "[data-ai='modalTitle']"
        );
        this.responseModalVideo = this.$modal.querySelector("[data-ai='video']");
        this.responseModalVideoSource = this.$modal.querySelector(
            "[data-ai='videoSource']"
        );

        this.indicatorWrapper = document.querySelector(".indicator-w");
    }

    setupStates() {
        this.STATES = {
            INITIAL: {
                name: "initial",
                box: {
                    width: "16rem",
                    height: "4.2rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "6rem",
                label: "Ask Translink",
                questionVisible: false,
            },
            EXPANDED: {
                name: "expanded",
                box: {
                    width: "29rem",
                    height: "14rem"
                },
                wrapper: {
                    padding: 1,
                    borderRadius: "2.2rem"
                },
                borderRadius: "2.2rem",
                label: "How can I guide you?",
                questionVisible: true,
            },
            THINKING: {
                name: "thinking",
                box: {
                    width: "29rem",
                    height: "4.2rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "2.2rem",
                label: "Thinking...",
                questionVisible: true,
            },
            RESPONSE: {
                name: "response",
                box: {
                    width: "29rem",
                    height: "4.2rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "2.2rem",
                label: "Another question?",
                questionVisible: true,
            },
            MODAL_INITIAL: {
                name: "modal-initial",
                box: {
                    width: "33.5rem",
                    height: "4.2rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "2.2rem",
                label: "Ask me for more",
                questionVisible: false,
            },
            MODAL_EXPANDED: {
                name: "modal-expanded",
                box: {
                    width: "33.5rem",
                    height: "20rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "2rem",
                label: "Tell me more",
                questionVisible: true,
            },
            MODAL_THINKING: {
                name: "modal-thinking",
                box: {
                    width: "33.5rem",
                    height: "4.2rem"
                },
                wrapper: {
                    padding: 1
                },
                borderRadius: "2.2rem",
                label: "Wait a second...",
                questionVisible: true,
            },
        };
        this.currentState = this.STATES.INITIAL;

        this.shakeConfig = {
            keyframes: [{
                x: -8
            }, {
                x: 8
            }, {
                x: -8
            }, {
                x: 8
            }, {
                x: 0
            }],
            ease: "none",
            duration: 0.4,
        };
    }

    createExpandTimelineFor(targetState) {
        // console.log(targetState, this.currentState);

        if (
            targetState === this.STATES.EXPANDED &&
            this.currentState === this.STATES.THINKING
        )
            // Hide response
            this.hideResponse();

        const label = targetState ? .label || "";
        return gsap
            .timeline({
                paused: true,
                defaults: {
                    ease: easePrimary,
                    duration: 0.4
                },
                onStart: () => {
                    // set isIdleScrollAllowed to false
                    ScrollController.isIdleScrollAllowed = false;

                    if (isMobile())
                        gsap.to(this.indicatorWrapper, {
                            autoAlpha: 0,
                            yPercent: 100,
                            filter: "blur(0.5rem)",
                            duration: 0.8,
                        });
                },
            })
            .fromTo(
                this.questionWrapper, {
                    autoAlpha: 0,
                    scale: 0.95,
                    attr: {
                        ["data-after"]: ""
                    },
                }, {
                    delay: 0.2,
                    autoAlpha: 1,
                    scale: 1,
                    transformOrigin: "bottom center",
                    attr: {
                        ["data-after"]: "Press Enter to send"
                    },
                }
            )
            .to(this.buttonLabel, {
                text: label
            }, "<")
            .to(this.buttonIcon, {
                rotate: 180
            }, "<")
            .eventCallback("onComplete", () => {
                this.isAnimating = false;
                this.question.disabled = false;
                this.question.focus();
            });
    }

    createCollapseTimelineFor(targetState) {
        const label = targetState ? .label || "";
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                ease: easeInstant,
                duration: 0.4
            },
            onStart: () => {
                // set isIdleScrollAllowed back to true
                ScrollController.isIdleScrollAllowed = true;
            }
        });

        const questionWrapperTween =
            this.currentState.name === "expanded" ?
            gsap.to(this.questionWrapper, {
                autoAlpha: 0,
                scale: 0.95,
                immediateRender: false,
                attr: {
                    ["data-after"]: ""
                },
            }) :
            gsap.set(this.questionWrapper, {
                autoAlpha: 0,
                attr: {
                    ["data-after"]: ""
                },
            });

        // Hide response
        this.hideResponse();

        tl
            // .add(questionWrapperTween)
            .set(this.questionWrapper, {
                autoAlpha: 0,
                attr: {
                    ["data-after"]: ""
                },
            })
            .set(this.buttonInner, {
                pointerEvents: "auto"
            })
            .to(this.buttonIcon, {
                rotate: 0
            }, "<")
            .to(this.buttonLabel, {
                text: label
            }, "<")
            .eventCallback("onComplete", () => {
                if (isMobile())
                    gsap.to(this.indicatorWrapper, {
                        autoAlpha: 1,
                        yPercent: 0,
                        filter: "blur(0rem)",
                        duration: 0.8,
                    });
                this.isAnimating = false;
            });

        return tl;
    }

    // createThinkingTimelineFor(targetState) {
    //   console.log(targetState)

    //   const label = targetState?.label || this.STATES.THINKING.label;

    //   return gsap
    //     .timeline({
    //       paused: true,
    //       defaults: { ease: easePrimary, duration: 0.3 },
    //       onComplete: () => {
    //         html.classList.add(CLASS.AI_THINKING);
    //       },
    //     })
    //     .to([this.button, this.buttonWrapper], {
    //       height: this.STATES.THINKING.box.height,
    //     })
    //     .to(
    //       this.buttonLabel,
    //       {
    //         text: label,
    //         onStart: () => {
    //           this.question.disabled = true;
    //           this.button.disabled = true;
    //           this.buttonInner.style.pointerEvents = "none";
    //         },
    //       },
    //       "<")
    //     .to(
    //       this.questionWrapper,
    //       {
    //         autoAlpha: 0.7,
    //         width: "29rem",
    //         height: "auto",
    //         marginBottom: 0,
    //         attr: { ["data-after"]: "" },
    //       },
    //       "<")
    //     .to(
    //       this.buttonIcon,
    //       {
    //         rotate: -180,
    //         transformOrigin: "50% 50%",
    //         duration: 0.8,
    //         repeat: -1,
    //         ease: "none",
    //       },
    //       "<");
    // }

    createThinkingTimelineFor(targetState) {
        const label = targetState ? .label || this.STATES.THINKING.label;

        const getQuestionWrapperTween = () => {
            switch (targetState.name) {
                case this.STATES.THINKING.name:
                    return {
                        type: "to",
                        props: {
                            autoAlpha: 0.7,
                            width: "29rem",
                            height: "auto",
                            marginBottom: 0,
                            attr: {
                                ["data-after"]: ""
                            }
                        }
                    };
                case this.STATES.MODAL_THINKING.name:
                    return {
                        type: "set",
                        props: {
                            autoAlpha: 0,
                            width: "33.5rem",
                            height: "auto",
                            marginBottom: 0,
                            attr: {
                                ["data-after"]: ""
                            }
                        }
                    };
                default:
                    return {
                        type: "to",
                        props: {
                            autoAlpha: 0.7,
                            width: "29rem",
                            height: "auto",
                            marginBottom: 0,
                            attr: {
                                ["data-after"]: ""
                            }
                        }
                    };
            }
        };

        const tl = gsap.timeline({
            paused: true,
            defaults: {
                ease: easePrimary,
                duration: 0.3
            },
            onComplete: () => {
                html.classList.add(CLASS.AI_THINKING);
            },
        });

        tl.to([this.button, this.buttonWrapper], {
            height: this.STATES.THINKING.box.height,
        });

        tl.to(
            this.buttonLabel, {
                text: label,
                onStart: () => {
                    this.question.disabled = true;
                    this.button.disabled = true;
                    this.buttonInner.style.pointerEvents = "none";
                },
            },
            "<"
        );

        const questionWrapperTween = getQuestionWrapperTween();
        if (questionWrapperTween.type === "set") {
            tl.set(this.questionWrapper, questionWrapperTween.props, "<");
        } else {
            tl.to(this.questionWrapper, questionWrapperTween.props, "<");
        }

        tl.to(
            this.buttonIcon, {
                rotate: -180,
                transformOrigin: "50% 50%",
                duration: 0.8,
                repeat: -1,
                ease: "none",
            },
            "<"
        );

        return tl;
    }



    createResponseTimelineFor(targetState) {
        this.gl.audio.playUI("uiReply");
        const label = targetState ? .label || this.STATES.RESPONSE.label;

        return gsap
            .timeline({
                paused: true,
                defaults: {
                    ease: easePrimary,
                    duration: 0.3
                },
                onComplete: () => {
                    this.button.disabled = false;
                    this.buttonInner.style.pointerEvents = "auto";
                },
            })
            .to(this.buttonLabel, {
                text: label
            }, "<")
            .to(
                this.buttonIcon, {
                    rotate: 0,
                    scale: 1,
                    duration: 1,
                    ease: "none",
                },
                "<"
            );
    }

    createClosingTimelineFor(targetState) {
        const label = targetState ? .label || this.STATES.EXPANDED.label;

        return gsap
            .timeline({
                paused: true,
                defaults: {
                    ease: easePrimary,
                    duration: 0.3
                },
            })
            .to(this.buttonLabel, {
                text: label
            })
            .to(this.buttonIcon, {
                rotate: 0,
                scale: 1
            }, "<")
            .to(
                this.questionWrapper, {
                    autoAlpha: 1,
                    width: "27.5rem",
                    height: "8.5rem",
                    marginBottom: 0,
                    attr: {
                        ["data-after"]: "Press Enter to send"
                    },
                },
                "<"
            );
    }

    toggleState() {
        const {
            INITIAL,
            EXPANDED,
            MODAL_INITIAL,
            MODAL_EXPANDED,
            THINKING
        } =
        this.STATES;

        let targetState;

        switch (this.currentState) {
            case INITIAL:
                targetState = EXPANDED;
                break;
            case MODAL_INITIAL:
                targetState = MODAL_EXPANDED;
                break;
            case MODAL_EXPANDED:
                targetState = MODAL_INITIAL;
                break;
            case THINKING:
                targetState = EXPANDED;
                break;
            default:
                targetState = INITIAL;
        }

        this.transitionToState(targetState);
    }

    async transitionToState(targetState) {
        // console.log("Transitioning to", targetState);

        if (this.isAnimating || targetState === this.currentState) return;

        this.isAnimating = true;
        const isInitial = targetState === this.STATES.INITIAL;
        const isExpanded = targetState === this.STATES.EXPANDED;
        const isThinking = targetState === this.STATES.THINKING;
        const isModal = targetState === this.STATES.MODAL_INITIAL;
        const isModalExpanded = targetState === this.STATES.MODAL_EXPANDED;
        const isModalThinking = targetState === this.STATES.MODAL_THINKING;

        switch (targetState) {
            case this.STATES.MODAL_EXPANDED:
                this.gl.audio.playUI("uiAskTranslinkOpen");
                break;
            case this.STATES.EXPANDED:
                this.gl.audio.playUI("uiAskTranslinkOpen");
                break;
            case this.STATES.THINKING:
                this.gl.audio.playUI("uiQuestionSend");
                break;
            case this.STATES.MODAL_THINKING:
                this.gl.audio.playUI("uiQuestionSend");
                break;
        }

        // MODAL state handling
        // if (targetState === this.STATES.MODAL_INITIAL) {
        //   gsap.set(this.button, {
        //     width: targetState.box.width,
        //     height: targetState.box.height
        //   });
        //   this.currentState = targetState;
        //   return;
        // }

        // MODAL state and going to EXPANDED
        if (
            this.currentState === this.STATES.MODAL_INITIAL &&
            targetState === this.STATES.EXPANDED
        ) {
            this.isAnimating = true;

            gsap.to(this.button, {
                width: "33.5rem",
                height: this.STATES.EXPANDED.box.height,
                duration: 0.4,
                ease: "power2.inOut",
                onComplete: () => {
                    this.currentState = targetState;
                    this.isAnimating = false;
                    this.question.focus();
                },
            });

            this.tlExpand = this.createExpandTimelineFor(targetState);
            this.tlExpand.restart();
            return;
        }

        gsap.killTweensOf([
            this.questionWrapper,
            this.buttonLabel,
            this.buttonIcon,
        ]);

        const flipState = Flip.getState([this.button, this.buttonWrapper], {
            props: "height, width, borderRadius",
        });

        // Set target dimensions
        gsap.set(this.button, {
            height: targetState.box.height,
            width: targetState.box.width,
            borderRadius: targetState.borderRadius,
            color: "#fff",
        });
        // gsap.set(this.buttonLabel, {
        //   text: targetState.label
        // });
        gsap.set(this.buttonWrapper, {
            borderRadius: targetState.borderRadius,
        });
        // gsap.set(this.buttonWrapper, targetState.wrapper);

        // Class udpates
        // this.button.classList.toggle("modal", targetState === this.STATES.MODAL_INITIAL);
        // this.buttonWrapper.classList.toggle("modal", targetState === this.STATES.MODAL_INITIAL);
        this.form.classList.toggle(
            "modal",
            targetState === this.STATES.MODAL_INITIAL ||
            targetState === this.STATES.MODAL_EXPANDED ||
            targetState === this.STATES.MODAL_THINKING
        );

        html.classList.toggle(CLASS.AI_THINKING, isThinking || isModalThinking);

        Flip.from(flipState, {
            duration: 0.4,
            ease: easeGentleIn,
            // ease: "power2.inOut",
            onStart: () => {
                if (isThinking || isModalThinking) {
                    this.tlThinking = this.createThinkingTimelineFor(targetState);
                    this.tlThinking.restart();
                } else if (
                    targetState === this.STATES.EXPANDED ||
                    targetState === this.STATES.MODAL_EXPANDED
                ) {
                    this.tlExpand = this.createExpandTimelineFor(targetState);
                    this.tlExpand.restart();
                } else {
                    this.tlCollapse = this.createCollapseTimelineFor(targetState);
                    this.tlCollapse.restart();
                }
            },
            onComplete: () => {
                this.currentState = targetState;
                this.isAnimating = false;
                if (isExpanded) this.question.focus();
            },
        });

        // Update global classes
        html.classList.toggle(CLASS.AI_OPEN, !isInitial && !isModal);

        if (isExpanded) {
            document.addEventListener("click", this.outsideClickBind);
        } else {
            document.removeEventListener("click", this.outsideClickBind);
        }
    }

    transitionToErrorState() {
        html.classList.add(CLASS.AI_ERROR);
        this.buttonLabel.textContent = "Error - Try Again";
        gsap.to(this.button, {
            // backgroundColor: "#ffebee",
            color: "#F00",
            duration: 0.3,
        });
    }

    parseResponse(rawResponse) {
        const parts = rawResponse.split(" | ").map((part) => part.trim());

        // we can put default values for when things are missing
        const result = {
            title: null,
            short: null,
            long: null,
            media: "IMG_9", // default image
            CTA: null,
        };

        // match the things we need
        parts.forEach((part) => {
            if (part.startsWith("(SH)")) {
                result.title = part.replace("(SH)", "").trim();
            } else if (part.startsWith("(SR)")) {
                result.short = part.replace("(SR)", "").trim();
            } else if (part.startsWith("(LR)")) {
                result.long = part.replace("(LR)", "").trim();
            } else if (part.startsWith("IMG_") || part.startsWith("VIDEO_")) {
                result.media = part;
            } else if (part.startsWith("CTA_")) {
                result.CTA = part;
            }
        });

        // console.log(result);

        return {
            question: this.question.value,
            title: result.title,
            short: result.short,
            long: result.long,
            media: result.media,
            CTA: result.CTA,
            timestamp: new Date().toISOString(),
        };
    }

    async handleResponse(data) {
        try {
            const rawResponse = data.result.content[0].text.value;
            const structuredResponse = this.parseResponse(rawResponse);
            // console.log(rawResponse);

            // Store in IndexedDB only if CTA is CTA_4 -> doesn't work since we have multiple CTAs in Modal state
            // if (structuredResponse.CTA === "CTA_4") {
            await this.db.saveResponse(structuredResponse);
            // Create accordion from DB
            await this.loadAccordionsFromDB();
            // }

            // display in small ui
            // console.log(this.currentState);
            if (this.currentState === this.STATES.THINKING) {
                this.displayResponse(structuredResponse);
            }
            if (this.currentState === this.STATES.MODAL_THINKING) {
                const accordionList = document.querySelectorAll(".accordion");
                this.accordions[this.accordions.length - accordionList.length].open();

                // toggle state to modal_initial
                this.transitionToState(this.STATES.MODAL_INITIAL);
                // clear question+focus
                this.question.value = "";
                this.question.focus();
            }
        } catch (error) {
            console.error("Response handling failed:", error);
            this.transitionToErrorState();
        }
    }

    async loadAccordionsFromDB() {
        try {
            const responses = await this.db.getAllResponses();
            this.accordionWrapper.innerHTML = ""; // Clear existing accordions

            // Sort by timestamp (newest first)
            const sortedResponses = responses.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            sortedResponses.forEach((response, index) => {
                this.createAndAppendAccordion(response);
            });
        } catch (error) {
            console.error("Failed to load accordions from DB:", error);
        }
    }

    createAndAppendAccordion(response) {
        const accordion = this.createAccordion(
            response.question,
            response.title,
            response.long,
            response.media.includes("IMAGE") || response.media.includes("IMG") ?
            "image" :
            "video",
            response.media.includes("IMAGE") || response.media.includes("IMG") ?
            `/assets/ai-images/${response.media}.webp` :
            `/assets/ai-video/${response.media}.mp4`,
            response.CTA
        );

        this.accordionWrapper.appendChild(accordion);
        const accordionInstance = new Accordion(accordion);
        accordionInstance.init();
        this.accordions.push(accordionInstance);

        // // Open the newly added accordion
        // if (this.accordions.length > 0) {
        //   // Close any previously open accordion first
        //   this.accordions.slice(0, -1).forEach(acc => {
        //     if (acc.$details.open) {
        //       acc.shrink();
        //     }
        //   });
        //   // Open the last accordion
        //   this.accordions[this.accordions.length - 1].open();
        // }
    }

    createAccordion(
        question = "",
        title = "",
        long = "",
        media = "",
        mediaURL = "",
        CTA = ""
    ) {
        const accordion = document.createElement("details");
        accordion.className = "accordion";
        accordion.ariaExpanded = false;

        const ctaButtons = {
            CTA_1: `
      <a class="cta_1" href="/specs">
        <div>View Specs</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
          <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </a>`,
            CTA_2: `
      <a class="cta_2" href="#">
        <div>Contact OFF+BRAND.</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
          <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </a>`,
            CTA_3: `
      <a class="cta_3" href="/preorder">
        <div>Preorder</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
          <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </a>`,
            CTA_4: `
      <a class="cta_4" href="/specs">
        <div>View Specs</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
          <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </a>`,
        };

        // const ctaButtons = {
        //   CTA_1: `
        //   <button class="cta_1">
        //     <div>View Specs</div>
        //     <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
        //       <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
        //             stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        //     </svg>
        //   </button>`,
        //   CTA_2: `
        //   <button class="cta_2">
        //     <div>Contact OFF+BRAND.</div>
        //     <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
        //       <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
        //             stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        //     </svg>
        //   </button>`,
        //   CTA_3: `
        //   <button class="cta_3">
        //     <div>Preorder</div>
        //     <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
        //       <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
        //             stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        //     </svg>
        //   </button>`,
        //   CTA_4: `
        //   <button class="cta_4">
        //     <div>View Specs</div>
        //     <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 9 9" fill="none" class="cta__arrow">
        //       <path d="M4.91455 7.82678L8.2332 4.50853M8.2332 4.50853L4.82233 1.09766M8.2332 4.50853L1.16016 4.50853"
        //             stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        //     </svg>
        //   </button>`,
        // };

        let mediaBlock = "";
        if (media === "image") {
            mediaBlock = `
      <figure class="visual__big-w" data-ai="modalVisualWrapper">
        <img src="${mediaURL}" alt="" class="visual" data-ai="modalVisual" loading="eager">
      </figure>`;
        } else if (media === "video") {
            mediaBlock = `
      <div class="video-w">
        <video autoplay muted loop playsinline class="video__inner" data-ai="video">
          <source src="${mediaURL}" type="video/mp4" data-ai="videoSource">
        </video>
      </div>`;
        }

        accordion.innerHTML = `
    <summary class="accordion__summary">
      <div class="accordion__title-w">
        <div class="accordion__question">${question}</div>
        <div class="accordion__title">${title}</div>
      </div>
      <div class="accordion__arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 10 6" fill="none">
          <path d="M1.19531 1.17749L5.19531 5.17749L9.19531 1.17749"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
    </summary>
    <div class="accordion__content">
      <h4>${title}</h4>
      ${mediaBlock}
      <p class="response__long">${long}</p>
      ${ctaButtons[CTA] || ""}
    </div>
  `;

        return accordion;
    }

    displayResponse(response) {
        // update textarea height
        this.questionWrapperHeight =
            this.questionWrapper.getBoundingClientRect().height + 6;
        this.responseWrapper.style.marginBottom = this.questionWrapperHeight + "px";

        this.response.innerHTML = response.short;
        this.responseTitle.innerHTML = response.title;
        // update media based on CTA
        // CTA_1 â€“ See the Specifications (link)
        // CTA_2 â€“ Contact the Manufacturer (email)
        // CTA_3 â€“ Buy Now (link)
        // CTA_4 â€“ Know More (modal)
        switch (response.CTA) {
            case "CTA_1":
                this.responseVisual.src = `/assets/ai-images/${response.media}.webp`;
                break;
            case "CTA_2":
                this.responseVisual.src = `/assets/ai-images/avatar1.webp`;
                break;
            case "CTA_3":
                this.responseVisual.src = `/assets/ai-images/avatar2.webp`;
                break;
            case "CTA_4":
                if (response.media.includes("error")) {
                    this.responseVisual.src = `/assets/ai-images/avatar1.webp`;
                }
                if (response.media.includes("VIDEO")) {
                    this.responseVisual.src = `/assets/ai-images/avatar1.webp`;
                }
                if (response.media.includes("IMAGE")) {
                    this.responseVisual.src = `/assets/ai-images/${response.media}.webp`;
                }
                break;
        }

        // Display response once content ready
        this.responseWrapper.style.display = "flex";

        // Transition animations
        this.tlThinking.pause();
        this.tlThinking.kill();
        this.tlResponse = this.createResponseTimelineFor(this.STATES.RESPONSE);
        this.tlResponse.restart();

        // Update state classes
        html.classList.add(CLASS.AI_RESPONSE);
        html.classList.remove(CLASS.AI_THINKING);
        html.classList.remove(CLASS.AI_ERROR);

        // Handle CTAs
        if (this.CTAs[response.CTA]) {
            gsap.set(this.CTAs[response.CTA], {
                display: "flex"
            });
        } else {
            console.warn(`CTA not found: ${response.CTA}`);
        }

        // Animate response in
        gsap.fromTo(
            this.responseWrapper, {
                autoAlpha: 0,
                scale: 1.2,
                filter: "blur(1rem)",
            }, {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0rem)",
                duration: 0.3,
            }
        );
    }

    resetPrompt() {
        this.form.classList.remove("is--thinking");
        html.classList.remove(CLASS.AI_THINKING);
        this.buttonInner.disabled = false;
        this.question.disabled = false;
    }

    initEventListeners() {
        this.CTAs.CTA_4.addEventListener("click", async (e) => {
            //open modal
            this.Modal.open();

            // Hide response first
            await gsap.to(this.responseWrapper, {
                autoAlpha: 0,
                scale: 1.2,
                filter: "blur(1rem)",
                duration: 0.3,
            });
            this.responseWrapper.style.display = "none";

            // Reset state
            this.currentState = this.STATES.RESPONSE;
            gsap.set(this.questionWrapper, {
                clearProps: "all"
            });
            html.classList.remove(CLASS.AI_RESPONSE);
            this.question.value = "";
            gsap.set(Object.values(this.CTAs), {
                display: "none"
            });

            // Get containers and positions
            const modalContainer = document.querySelector(".modal__Translink-w"); // need to replace with [data-ai='w']?
            const originalBounds = this.form.getBoundingClientRect();

            await gsap.to(this.form, {
                y: 40,
                opacity: 0,
                duration: 0.3,
                ease: easePrimary,
            });

            const flipState = Flip.getState(this.form, {
                props: "width,height,borderRadius,opacity",
                simple: true,
            });

            modalContainer.appendChild(this.form);

            const finalPosition = this.form.getBoundingClientRect();
            const slideUpDistance = window.innerHeight - finalPosition.top + 40;

            gsap.set(this.form, {
                y: slideUpDistance,
                opacity: 0,
            });

            Flip.from(flipState, {
                duration: 0.3,
                ease: easePrimary,
                scale: true,
                onStart: () => {
                    this.transitionToState(this.STATES.MODAL_INITIAL);
                    // this.transitionToState(this.STATES.INITIAL);
                },
                onComplete: () => {
                    gsap.to(this.form, {
                        y: 0,
                        opacity: 1,
                        duration: 0.3,
                        ease: easePrimary,
                    });
                },
            });
        });

        this.closeQuestion.addEventListener("click", (e) => {
            e.stopPropagation();

            // close modal
            if (html.classList.contains(CLASS.MODAL_OPEN)) {
                this.Modal.close();
            }

            this.transitionToState(this.STATES.INITIAL);

            // Hide response
            // this.hideResponse();
            // gsap.to(this.responseWrapper, {
            //   autoAlpha: 0,
            //   scale: 1.2,
            //   filter: "blur(1rem)",
            //   transformOrigin: "center center",
            //   // y: 20,
            //   duration: 0.3,
            //   onComplete: () => {
            //     this.responseWrapper.style.display = "none";

            //     // Reset input field
            //     this.question.value = "";

            //     // Hide any visible CTAs
            //     gsap.set(Object.values(this.CTAs), { display: "none" });

            //     this.currentState = this.STATES.RESPONSE;
            //     this.transitionToState(this.STATES.EXPANDED);

            //     // this.buttonInner.style.pointerEvents = "auto";
            //     // this.buttonInner.style.cursor = "";
            //     this.button.disabled = false;
            //     this.question.disabled = false;
            //     html.classList.remove(CLASS.AI_THINKING);

            //     gsap.set(this.questionWrapper, {
            //       clearProps: "all"
            //     });
            //     html.classList.remove(CLASS.AI_RESPONSE)

            //   }
            // });
        });

        this.buttonInner.addEventListener("click", (e) => {
            // e.stopPropagation();
            this.toggleState();
        });

        window.addEventListener("keydown", (e) => {
            // ESC handler
            if (
                e.key === "Escape" &&
                this.currentState === this.STATES.EXPANDED &&
                !this.isAnimating
            ) {
                this.transitionToState(this.STATES.INITIAL);
            }

            // Enter key handler (only in expanded state)
            if (
                e.key === "Enter" &&
                (this.currentState === this.STATES.EXPANDED ||
                    this.currentState === this.STATES.MODAL_EXPANDED) &&
                !this.isAnimating
            ) {
                this.handleEnterKey(e);
            }
        });
    }

    handleEnterKey(e) {
        e.preventDefault();

        // 3 character minimum TBC?
        if (this.question.value.length < 4) {
            this.playShakeAnimation();
            return;
        }

        this.submitQuestion();
    }

    hideResponse() {
        gsap.to(this.responseWrapper, {
            autoAlpha: 0,
            scale: 1.2,
            filter: "blur(1rem)",
            transformOrigin: "center center",
            // y: 20,
            duration: 0.3,
            onComplete: () => {
                this.responseWrapper.style.display = "none";

                // Reset input field
                this.question.value = "";

                // Hide any visible CTAs
                gsap.set(Object.values(this.CTAs), {
                    display: "none"
                });

                this.currentState = this.STATES.RESPONSE;
                // this.transitionToState(this.STATES.EXPANDED);

                this.button.disabled = false;
                this.question.disabled = false;
                html.classList.remove(CLASS.AI_THINKING);

                gsap.set(this.questionWrapper, {
                    clearProps: "all",
                });
                html.classList.remove(CLASS.AI_RESPONSE);
            },
        });
    }
    playShakeAnimation() {
        if (this.shakeTween) this.shakeTween.kill();
        this.shakeTween = gsap.to(this.questionWrapper, {
            ...this.shakeConfig,
            onInterrupt: () => gsap.set(this.questionWrapper, {
                clearProps: "x"
            }),
            onComplete: () => gsap.set(this.questionWrapper, {
                clearProps: "x"
            }),
        });
    }

    outsideClickBind = (e) => {
        if (
            this.currentState === this.STATES.EXPANDED &&
            !this.form.contains(e.target) &&
            !this.isAnimating
        ) {
            this.transitionToState(this.STATES.INITIAL);
        }
    };

    async submitQuestion() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
            if (this.currentState === this.STATES.EXPANDED) {
                await this.transitionToState(this.STATES.THINKING);
            } else if (this.currentState === this.STATES.MODAL_EXPANDED) {
                // Close any open accordion
                if (this.accordions.length > 0) {
                    this.accordions.forEach((accordion) => {
                        if (accordion.$details.open) {
                            accordion.shrink();
                        }
                    });
                }
                await this.transitionToState(this.STATES.MODAL_THINKING);
            }

            const response = await fetch(url(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    question: this.question.value
                }),
            });

            if (!response.ok) throw new Error("API error");
            const data = await response.json();

            this.handleResponse(data);
        } catch (error) {
            // Transition to error state
            this.transitionToErrorState();
            console.error("Submission failed:", error);
        } finally {
            this.isSubmitting = false;
        }
    }

    transitionToThinkingState() {
        html.classList.add(CLASS.AI_THINKING);
        this.buttonInner.disabled = true;
        this.question.disabled = true;
    }

    handleSubmitClick(e) {
        e.stopPropagation();
        this.toggleState();
    }

    destroy() {
        // console.log('Destroying Translink...');

        this.tlExpand ? .kill();
        this.tlCollapse ? .kill();
        this.tlThinking ? .kill();
        this.tlResponse ? .kill();

        this.buttonInner ? .removeEventListener("click", this.toggleState);
        window.removeEventListener("keydown", this.handleEnterKey);
        document.removeEventListener("click", this.outsideClickBind);
        this.closeQuestion ? .removeEventListener("click", this.hideResponse);

        this.accordions ? .forEach((acc) => acc ? .destroy ? .());
        this.accordions = [];

        html.classList.remove(
            "has-ai-open",
            "has-ai-thinking",
            "has-ai-response",
            "has-ai-error",
            "has-modal-open"
        );

        this.Modal ? .destroy ? .();
        Translink.instance = null;
    }
}