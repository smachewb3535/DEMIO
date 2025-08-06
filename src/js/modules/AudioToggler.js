import {
    Observe
} from './_/observe'
import gsap from '@/gsap'
import {
    roundNumber
} from '../utils/math'
import Gl from '@/gl/Gl'

export class AudioToggler extends Observe {
    static WAVE = {
        POINTS: 25,
        AMPLITUDE_ON: 2.5,
        AMPLITUDE_OFF: 0,
        LENGTH: 2,
        SPEED_ON: 0.1,
        SPEED_OFF: 0,
        OFFSET: 8,
    }

    static instance = null;

    constructor(element) {
        if (AudioToggler.instance) return AudioToggler.instance;
        super(element);
        AudioToggler.instance = this;

        this.el = element;
        this.$path = this.el.querySelector('path');
        this.isAllowed = false;

        this.onToggleAudio = this.onToggleAudio.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onFirstInteraction = this.onFirstInteraction.bind(this);

        document.addEventListener("firstInteraction", this.onFirstInteraction);

        this.label = {
            unmute: this.el.dataset.label ? .split(',')[0] || 'Play audio',
            mute: this.el.dataset.label ? .split(',')[1] || 'Mute audio',
        };

        this.gl = new Gl();
        this.init();
    }

    init() {
        if (!this.isRafPlaying) {
            this.initButtonWave();
            this.playRaf();
            this.onToggleAudio();
        }
        this.bindEvents();
        this.enableToggler();

        this.wasAudioOnBeforeFocusLost = false;
        this.onVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    bindEvents() {
        this.el.addEventListener('click', this.onToggleAudio);
    }

    unbindEvents() {
        this.el.removeEventListener('click', this.onToggleAudio);
    }

    onFirstInteraction() {
        if (this.isAllowed) return;

        this.isAllowed = true;
        this.onToggleAudio();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if (this.wave.targetAmplitude > 0) {
                this.wasAudioOnBeforeFocusLost = true;
                this.onToggleAudio(); // Turn audio off
            } else {
                this.wasAudioOnBeforeFocusLost = false;
            }
        } else {
            if (this.wasAudioOnBeforeFocusLost && this.wave.targetAmplitude === 0) {
                this.onToggleAudio(); // Turn audio back on
            }
        }
    }

    onToggleAudio() {
        this.isTurningOff = this.wave.targetAmplitude > 0

        if (this.isTurningOff) {
            this.el.classList.remove('is-active');
            this.wave.targetAmplitude = AudioToggler.WAVE.AMPLITUDE_OFF;
            this.wave.targetSpeed = AudioToggler.WAVE.SPEED_OFF;
            this.el.setAttribute('aria-label', this.label.mute);
            // this.gl.audio.animateAudioOut();
            this.gl.audio.toggleGlobalVolume(0);
        } else {
            this.el.classList.add('is-active');
            this.wave.targetAmplitude = AudioToggler.WAVE.AMPLITUDE_ON;
            this.wave.targetSpeed = AudioToggler.WAVE.SPEED_ON;
            this.el.setAttribute('aria-label', this.label.unmute);
            this.playRaf();
            this.gl.audio.animateAudioIn();
            this.gl.audio.toggleGlobalVolume(0.2);
        }
    }

    initButtonWave() {
        this.wave = {
            amplitude: AudioToggler.WAVE.AMPLITUDE_OFF,
            targetAmplitude: AudioToggler.WAVE.AMPLITUDE_OFF,
            speed: AudioToggler.WAVE.SPEED_OFF,
            targetSpeed: AudioToggler.WAVE.SPEED_OFF,
            points: [],
            time: 0,
        }

        this.isRafPlaying = false
        this.rafIncrement = 0

        for (let i = 0; i <= AudioToggler.WAVE.POINTS; i++) {
            this.wave.points.push(i)
        }

        this.playRaf()
    }

    onUpdate() {
        this.wave.amplitude += (this.wave.targetAmplitude - this.wave.amplitude) * 0.05
        this.wave.speed += (this.wave.targetSpeed - this.wave.speed) * 0.05

        const points = this.wave.points.map((x) => {
            const y = AudioToggler.WAVE.OFFSET + this.wave.amplitude * Math.sin((x + this.wave.time) / AudioToggler.WAVE.LENGTH)
            return [x, y]
        })

        const path = `M${points.map(([x, y]) => `${x},${y}`).join(' L')}`;
        if (this.$path) this.$path.setAttribute('d', path);

        this.wave.time += this.wave.speed

        if (
            roundNumber(this.wave.speed, 3) < 0.01 &&
            roundNumber(this.wave.amplitude, 3) < 0.01
        ) {
            this.rafIncrement++;

            if (this.rafIncrement >= 30) this.pauseRaf();
        }

    }

    resumeWave() {
        if (this.isTurningOff) return;

        this.el = document.querySelector('.sound-w'); // rebind root
        this.el.classList.add('is-active');
        this.$path = this.el ? .querySelector('path'); // rebind path

        if (!this.el || !this.$path) {
            console.warn('[AudioToggler] Element or path missing on resume');
            return;
        }

        // Rebind click handler if DOM changed
        this.unbindEvents(); // just in case old one lingers
        this.bindEvents();

        this.wave.targetAmplitude = AudioToggler.WAVE.AMPLITUDE_ON;
        this.wave.targetSpeed = AudioToggler.WAVE.SPEED_ON;
        this.wave.amplitude = 1;
        this.wave.speed = 0.05;
        this.rafIncrement = 0;
        this.playRaf();
    }




    playRaf() {
        if (this.isRafPlaying) return;
        this.isRafPlaying = true;
        this.rafIncrement = 0;
        gsap.ticker.add(this.onUpdate);
    }

    pauseRaf() {
        if (!this.isRafPlaying) return;

        this.isRafPlaying = false;
        gsap.ticker.remove(this.onUpdate);
    }

    enableToggler() {
        this.el.disabled = false;
    }

    disableToggler() {
        this.el.disabled = true;
    }

    destroy() {
        document.removeEventListener("firstInteraction", this.onFirstInteraction);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.unbindEvents();
        AudioToggler.instance = null;
        super.destroy();
    }
}