import React, { useEffect, useState } from "react"
import Visualization from "./Visualization"
import { Note, Chord, ChordDictionary } from "@tonaljs/tonal"
import * as VRD from "viardot" // testing dir

function App() {
  useEffect(() => {
    VRD.start()
    VRD.context.setReverb(0.65, 2500, 0.2, 0.0)

    // mouse events
    const mouse = { x: 0, y: 0 }
    window.onmousedown = (e) =>
      voices.forEach((v) => {
        if (v.enabled) v.start()
      })
    window.onmouseup = (e) => voices.forEach((v) => v.stop())
    window.onmousemove = (e) => {
      // calculate normalized mouse position
      mouse.y = clamp(1 - e.clientY / window.innerHeight, 0, 1)
      mouse.x = clamp(e.clientX / window.innerWidth, 0, 1)

      // calculate phomeme interpolation
      const x = clamp(mouse.x - 0.1, 0, 1)
      const pos = phonemes.length * x
      const i1 = pos >> 0
      const i2 = (pos + 1) >> 0
      const p1 = phonemes[i1]
      const p2 = phonemes[i2]
      const interpolant = pos - i1
      const phoneme = [
        lerp(p1[0], p2[0], interpolant),
        lerp(p1[1], p2[1], interpolant),
        lerp(p1[2], p2[2], interpolant),
      ]

      // update voices
      voices.forEach((v) => {
        const baseFreq = v.range.bottom + (v.range.top - v.range.bottom) * mouse.y
        const note = Note.fromFreq(baseFreq)
        const freq = Note.freq(note)
        v.setFrequency(baseFreq)
        v.setPhoneme(phoneme)
      })
    }

    // clean-up
    return () => {
      window.onmousedown = null
      window.onmouseup = null
      window.onmousemove = null
    }
  }, [])

  return (
    <div className="flex">
      <Visualization voices={voices} colors={colors} />
      <main className="main">
        {letters.map((letter, i) => (
          <Letter key={letter} value={letter} />
        ))}
      </main>
      <div className="wrapper">
        <Voices />
      </div>
    </div>
  )
}

const Letter = (props: any) => {
  return <span className="">{props.value}</span>
}

const Voices = (props: any) => {
  return (
    <div className="absolute top-0 left-0">
      {voices.map((v, i) => (
        <VoiceToggle key={i} voice={v} color={colors[i]} />
      ))}
    </div>
  )
}

const Controls = (props: any) => {
  const setLoudness = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    console.log(value)
    voices.forEach((v) => v.setLoudness(value))
  }

  return (
    <div className="absolute flex flex-col top-0 left-0">
      <input type="range" min={0} max={1} step={0.01} defaultValue={0.5} onChange={(e) => setLoudness(e)} />
    </div>
  )
}

const VoiceToggle = (props: any) => {
  const [active, setActive] = useState(true)
  const color = () => (active ? props.color : "#222")

  const onmousedown = (e: React.MouseEvent<HTMLDivElement>) => {
    props.voice.enabled = !props.voice.enabled
    setActive(!active)
  }

  return (
    <div className="text-xl" style={{ color: color() }} onMouseDown={onmousedown}>
      <a>{VRD.Fach[props.voice.fach]}</a>
    </div>
  )
}

export default App

// utils
function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t
}

function clamp(value: number, a: number, b: number) {
  return Math.min(Math.max(value, a), b)
}

// data
const colors = ["#6249bd", "#0099ff", "#00ffaa", "#ff9100"]
const letters = ["a", "e", "i", "o", "u"]

const voices = [
  new VRD.Voice(VRD.Fach.Soprano),
  new VRD.Voice(VRD.Fach.Contralto),
  new VRD.Voice(VRD.Fach.Tenor),
  new VRD.Voice(VRD.Fach.Bass),
]

const phonemes = [VRD.Phonemes.aa, VRD.Phonemes.ah, VRD.Phonemes.iy, VRD.Phonemes.ao, VRD.Phonemes.uw]
