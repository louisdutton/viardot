import { useState, useEffect } from 'react'
import './App.css'
import * as Viardot from '../../src/index' // testing dir
import { Chord, ChordType, Note } from '@tonaljs/tonal'

const Random = {
  range: (a: number, b: number) => a + b * Math.random(),
  value: () => Math.random()
}

function App() {
  const [voice, setVoice] = useState<Viardot.Voice>()

  useEffect(() => {
    Viardot.start()
    console.log(Viardot.context)

    const master = Viardot.context.master

    const Q = new Viardot.Quartet([
      Viardot.Fach.Tenor,
      Viardot.Fach.Baritone,
      Viardot.Fach.Baritone,
      Viardot.Fach.Bass
    ]);

    // let root = 440

    const randOctave = () => 3 + Math.random() << 0
    const randNote = () => ['C', 'D', 'E', 'F', 'G', 'A', 'B'][7 * Math.random() << 0]
    const chords = ChordType.all().filter(c => c.intervals.length === 4)
    const randChord = () => chords[Math.round(Math.random()*(chords.length-1))].aliases[0]
    const phonemes = ['aa', 'ah', 'iy', 'ao', 'uw']
    let phoneme = phonemes[0]

    window.onmousemove = e => {
      const pos = e.clientX/window.innerWidth
      // v.setIntensity(.85)
      var p = phonemes[phonemes.length * pos << 0]
      if (p != phoneme) {
        Q.voices.forEach(v => v.setPhoneme(Viardot.Phonemes[p])) 
        phoneme = p
      }
    }

    window.onmousedown = e => {
      const chord: number[] = Chord.getChord(
        randChord(),
        randNote() + randOctave()
      ).notes.map(note => Note.freq(note)!)

      console.log(randChord())
      
      Q.voices[3].setFrequency(chord[0])
      Q.voices[2].setFrequency(chord[1])
      Q.voices[1].setFrequency(chord[2])
      Q.voices[0].setFrequency(chord[3])
      Q.voices.forEach(v => {
        v.start()
      })
    }
    window.onmouseup = e => {
      Q.voices.forEach(v => v.stop())
    }
  })

  return (
    <div className="App">
      <main className="main">
        <div className='phoneme'>a</div>
        <div className='phoneme'>e</div>
        <div className='phoneme'>i</div>
        <div className='phoneme'>o</div>
        <div className='phoneme'>u</div>
      </main>
    </div>
  )
}

export default App
