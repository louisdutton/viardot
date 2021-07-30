import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import './App.css'

// External modules
import * as VIARDOT from '../viardot'
import * as RITA from 'rita'

const InputField = styled.input`
  border-radius: 25px;
  background-color: #333;
  height: 40px;
`

const Toggle = styled.input`
  height: 40px;
  width: 40px;
`

export default function App() {
  const [voice, setVoice] = useState(null)
  const [on, setOn] = useState(false)

  useEffect(()=>{
    setVoice(new VIARDOT.voice())
  },[]);

  var onMouseMove = (e) => {
    if (!voice) return
    if (voice.busy) return
    var intensity = (e.screenX / window.innerWidth) * 0.6
    var frequency = 220 + (1 - e.screenY / window.innerHeight) * 440
    voice.setFrequency(frequency)
    voice.setIntensity(intensity)
  }

  return (
    <div className="App" onMouseMove={onMouseMove}>
      <header className="App-header">
        <h1>Viardot</h1>
        <Input voice={voice}/>
      </header>
    </div>
  )
}

function Input(p) {
  const [IPA, setIPA] = useState('')

  var onChange = (e) => {
    var phones = RITA.phones(e.target.value)
    setIPA(phones)
    // p.voice.recieve(phones)
  }

  var toggleVoice = (e) => {
    if (e.target.checked) p.voice.start()
    else p.voice.stop()
  }

  return (
    <div className='Input'>
      <InputField onChange={onChange} placeholder='Enter text'/>
      <p id="values">{IPA}</p>
      <Toggle type='checkbox' onChange={toggleVoice}/>
    </div>
  )
}
