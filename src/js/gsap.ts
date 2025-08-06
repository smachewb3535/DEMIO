import gsap from 'gsap'

import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { TextPlugin } from 'gsap/TextPlugin'
import { Flip } from 'gsap/Flip'
import { SplitText } from 'gsap/SplitText'

import { prefersReducedMotion } from './utils/media'

gsap.registerPlugin(SplitText, DrawSVGPlugin, CustomEase, ScrollTrigger, MorphSVGPlugin, TextPlugin, Flip)

ScrollTrigger.refresh()

const easeMenu = CustomEase.create('custom', 'M0,0 C0.61,-0.01 0,1 1,1')
const easePrimary = CustomEase.create('customEase', '0.6, 0.01, 0.05, 1')
const easeDirectional = CustomEase.create('directionalEase', '0.16, 1, 0.3, 1')
const easeBlur = CustomEase.create('smoothBlur', '0.25, 0.1, 0.25, 1')
const easeGentleIn = CustomEase.create('gentleIn', '0.38, 0.005, 0.215, 1.1')
const easeQuickSnap = CustomEase.create('quickSnap', '0.22, 1, 0.36, 1')
const easeInstant = CustomEase.create('instantEase', '0.1, 0, 0, 1')
const easeText = CustomEase.create('cssEase', '0.215, 0.61, 0.355, 1')

const defaults = {
  ease: 'expo.out',
  duration: 1.2,
}

gsap.defaults(defaults)

const reduced = prefersReducedMotion()

export default gsap
export { defaults, ScrollTrigger, SplitText, Flip, reduced, easeMenu, easePrimary, easeDirectional, easeBlur, easeGentleIn, easeQuickSnap, easeInstant, easeText }
