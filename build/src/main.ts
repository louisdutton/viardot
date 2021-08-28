import './style.css'
import { Voice, FACH } from './viardot'

const voice = new Voice(FACH.BASS);

onpointerdown = () => voice.start()
onpointerup = () => voice.stop()
onmousemove = e => {
  const normalizedPos = 1 - clamp(e.y / window.innerHeight, 0, 1)
  voice.setFrequency(normalizedPos)
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max))
}
