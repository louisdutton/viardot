import { useState, useEffect } from 'react'
import './App.css'
import { Voice, Fach, start, Quartet } from '../../src/index' // testing dir

function App() {
  const [voice, setVoice] = useState<Voice>()

  useEffect(() => {
    start()
    const Q = new Quartet([
      Fach.Tenor,
      Fach.Baritone,
      Fach.Baritone,
      Fach.Bass
    ]);

    const root = 440

    window.onmousemove = e => {
      Q.voices[3].setFrequency((1 - e.clientY/window.innerHeight) * root)
      Q.voices[2].setFrequency((1 - e.clientY/window.innerHeight) * root * 3/2)
      Q.voices[1].setFrequency((1 - e.clientY/window.innerHeight) * root * 5/3)
      Q.voices[0].setFrequency((1 - e.clientY/window.innerHeight) * root * 7/3)

      Q.voices.forEach(v => v.setIntensity(e.clientX/window.innerWidth))
    }

    window.onmousedown = e => {
      Q.voices.forEach(v => v.start())
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
