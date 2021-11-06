import React, { useEffect, useState } from "react"
import { Note, Chord, ChordDictionary } from "@tonaljs/tonal"
import * as VRD from "../../src" // testing dir

export default function App() {
  useEffect(() => {
    VRD.start()
    VRD.context.setReverb(0.65, 2500, 0.2, 0.0)
    const voice = new VRD.Voice(VRD.Fach.Soprano)
    // voice.setPhoneme(VRD.Phonemes.aa)

    // mouse events
    const mouse = { x: 0, y: 0 }
    window.onmousedown = (e) => {
        if (voice.enabled) voice.start()
      }
    window.onmouseup = (e) => voice.stop()
    window.onmousemove = (e) => {
      // calculate normalized mouse position
      mouse.y = clamp(1 - e.clientY / window.innerHeight, 0, 1)
      mouse.x = clamp(e.clientX / window.innerWidth, 0, 1)

      const baseFreq = voice.range.bottom + (voice.range.top - voice.range.bottom) * mouse.y
      const note = Note.fromFreq(baseFreq)
      const freq = Note.freq(note)
      voice.setFrequency(freq ? freq : baseFreq)
    }

    // clean-up
    return () => {
      window.onmousedown = null
      window.onmouseup = null
      window.onmousemove = null
    }

  }, [])

  return <div/>
}

// utils
function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t
}

function clamp(value: number, a: number, b: number) {
  return Math.min(Math.max(value, a), b)
}
