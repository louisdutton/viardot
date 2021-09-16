import './style.css'
import { Voice, Fach, Start, Quartet } from './viardot'
// import { Chord, Note } from '@tonaljs/tonal'

let voice: Voice;

Start().then(() => {
  voice = new Voice(Fach.Baritone)
  console.log(voice);
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
}

// Tract UI
const tractUI = document.getElementById('tractUI') as HTMLCanvasElement
// tractUI.

// const quartet = new Quartet([
//   Fach.Mezzo,
//   Fach.Contralto,
//   Fach.Tenor,
//   Fach.Bass
// ])

const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

onpointerdown = () => {
  voice.start()
  // const root = letters[Math.round(Math.random()*(letters.length-1))] + '3'
  // console.log( root);
  
  // const chord = Chord.getChord("maj7", root).notes;
  // quartet.voices[0].setFrequency(Note.freq(Note.fromMidi(Note.midi(chord[3]))))
  // quartet.voices[1].setFrequency(Note.freq(Note.fromMidi(Note.midi(chord[1]))))
  // quartet.voices[2].setFrequency(Note.freq(Note.fromMidi(Note.midi(chord[2]))))
  // quartet.voices[3].setFrequency(Note.freq(Note.fromMidi(Note.midi(chord[0])-12)))

  // quartet.voices.forEach(v => v.start())
}

onpointerleave = () => {
  voice.stop()
  // quartet.voices.forEach(v => v.stop())
}

onpointerup = () => {
  voice.stop()
  // quartet.voices.forEach(v => v.stop())
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
