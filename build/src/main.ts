import './style.css'
import { Voice, FACH } from './viardot/viardot'

const voice = new Voice(FACH.SOPRANO);





window.addEventListener('pointermove', e => voice.setFrequency(1 - (e.screenY / window.innerHeight)), false)
window.addEventListener('pointerdown', () => voice.start(), false)
window.addEventListener('pointerup', () => voice.stop(), false)