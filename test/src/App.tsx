import { useState, useEffect } from 'react'
import './App.css'
import * as Viardot from '../../src/index' // testing dir
import { Chord, ChordType, Note } from '@tonaljs/tonal'

function App() {
  const [voice, setVoice] = useState<Viardot.Voice>()

  useEffect(() => {
    Viardot.start()
    console.log(Viardot.context)

    const master = Viardot.context.master

    const Q = new Viardot.Quartet([
      Viardot.Fach.Soprano,
      Viardot.Fach.Contralto,
      Viardot.Fach.Tenor,
      Viardot.Fach.Bass
    ]);

    let root = 440

    const randOctave = () => 3 + Math.round(Math.random() * 2)
    const randNote = () => ['C', 'D', 'E', 'F', 'G', 'A', 'B'][7 * Math.random() << 0]
    const chords = ChordType.all().filter(c => c.intervals.length === 4)
    const randChord = () => chords[Math.round(Math.random()*(chords.length-1))].aliases[0]
    const randPhoneme = (): 'aa'|'ih'|'ah'|'ao'|'uw' => ['aa', 'ih', 'ah', 'ao', 'uw'][5 * Math.random() << 0]

    window.onmousemove = e => {
      Q.voices.forEach(v => v.setIntensity(e.clientX/window.innerWidth))
    }

    window.onmousedown = e => {
      const chord: number[] = Chord.getChord(
        randChord(),
        randNote() + randOctave()
      ).notes.map(note => Note.freq(note)!)

      console.log(randChord());

      
      Q.voices[3].setFrequency(chord[0])
      Q.voices[2].setFrequency(chord[1])
      Q.voices[1].setFrequency(chord[2])
      Q.voices[0].setFrequency(chord[3])
      Q.voices.forEach(v => {
        v.start()
        v.setPhoneme(Viardot.Phonemes[randPhoneme()])
      })
    }
    window.onmouseup = e => {
      Q.voices.forEach(v => v.stop())
    }
  })

  return (
    <div className="App">
      <header className="App-header">
        
      </header>
    </div>
  )
}

export default App
