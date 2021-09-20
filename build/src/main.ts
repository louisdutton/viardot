import './style.css'
import { Voice, Fach, Start, Quartet } from './viardot'
// import { Chord, Note } from '@tonaljs/tonal'

let voice: Voice;

Start().then(() => {
  voice = new Voice(Fach.Baritone)
  // console.log(voice);
})

// index
const indexInput = document.getElementById('index')
indexInput.onchange = (e: Event) => {
  const value = (<HTMLInputElement>e.target).value
  voice.setIndex(parseFloat(value));
}

// diameter
const diameterInput = document.getElementById('diameter')
diameterInput.onchange = (e: Event) => {
  const value = (<HTMLInputElement>e.target).value
  voice.setDiameter(parseFloat(value));
  console.log(value);
  
}

// Tract UI
const tractUI = document.getElementById('tractUI') as HTMLCanvasElement
const ctx = tractUI.getContext('2d')
const dpr = window.devicePixelRatio
tractUI.width = 800 * dpr
tractUI.height = 400 * dpr
tractUI.style.width = 800 + 'px';
tractUI.style.height = 300 + 'px';

onpointerdown = () => {
  voice.start()

  // redraw tract
  ctx.clearRect(0, 0, tractUI.width, tractUI.height)
  const diameter: Float64Array = voice.getTractData()
  const dx = tractUI.width / diameter.length
  const scale = 100
  const center = tractUI.height/2
  ctx.lineWidth = 4

  // upper wall
  ctx.beginPath()
  ctx.moveTo(0, center)
  for (let i = 0; i < diameter.length; i++) {
    const x = i * dx
    const y = center + (diameter[i] * scale) / 2
    ctx.lineTo(x, y)
    ctx.fillRect(x-5, y-5, 10, 10)
  }
  ctx.stroke()

  // lower wall
  ctx.beginPath()
  ctx.moveTo(0, center)
  for (let i = 0; i < diameter.length; i++)
    ctx.lineTo(i * dx, center - (diameter[i] * scale) / 2)
  ctx.stroke()
}

onpointerleave = () => {
  voice.stop()
}

onpointerup = () => {
  voice.stop()
}

onmousemove = e => {
  const y = 1 - clamp(e.y / window.innerHeight, 0, 1)
  const x = 1 - clamp(e.x / window.innerWidth, 0, 1)
  voice.setFrequency(y * 440)
  voice.setIntensity(x)
}

const changeFach = (e: Event) => {
  const fach = (<HTMLInputElement>e.target).value
  voice = new Voice(Fach[fach])
}

const fachSelect = document.getElementById('fach')
fachSelect.addEventListener('change', changeFach, false)


const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max))
}
