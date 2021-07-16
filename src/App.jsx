import React, { useState } from 'react'
import './App.css'

// External modules
import * as VIARDOT from '../viardot'

export default function App() {
  const [voice, setVoice] = useState(null)
  const [on, setOn] = useState(false)

  var onMouseDown = () => {
    if (voice == null) {
      setVoice(new VIARDOT.Voice())
      return
    }
    if (voice.ready) voice.start()
    else voice.stop()
  }

  var onMouseMove = (e) => {
    if (voice == null) return
    var freq = 440 + (1 - (e.clientY / window.innerHeight)) * 440
    voice.setTargetFrequency(freq)
  }

  window.addEventListener('mousemove', onMouseMove, false)

  return (
    <div onMouseDown={onMouseDown} className="App">
      <header className="App-header">
        <h1>Viardot</h1>
        <Input/>
      </header>
    </div>
  )
}

function Input() {
  const [IPA, setIPA] = useState('')

  var onChange = (e) => {
    var words = e.target.value.split(/ /)
    var ipa = ''
    words.forEach(word => { ipa += VIARDOT.toPhonemes(word, true) + ' '; })
    setIPA(ipa)
  }

  return (
    <div className='Input'>
      <input onChange={onChange} placeholder="Enter transcription text" name="word"/>
      <p id="values">{IPA}</p>
    </div>
  )
}
