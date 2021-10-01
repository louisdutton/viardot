import { useState, useEffect } from 'react'
import './App.css'
import * as Viardot from '../../src/index' // testing dir
// import { Chord, ChordType, Note } from '@tonaljs/tonal'

function App() {
  // const [voice, setVoice] = useState<Viardot.Voice>()

  useEffect(() => {
    Viardot.start()

    const voice = new Viardot.Voice(Viardot.Fach.Baritone)
    const phonemes = ['aa', 'ah', 'iy', 'ao', 'uw']
    let phoneme = phonemes[0]

    // events
    window.onmousedown = e => voice.start()
    window.onmouseup = e => voice.stop()
    window.onmousemove = e => {
      const yPos = 1-e.clientY/window.innerHeight 
      const xPos = e.clientX/window.innerWidth

      // Frequency
      voice.setFrequency(400 * yPos)

      //
      var p = phonemes[phonemes.length * xPos << 0]
      if (p != phoneme) {
        voice.setPhoneme(Viardot.Phonemes[p]) 
        phoneme = p
      }
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
