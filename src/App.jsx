import React, { useState, useEffect } from 'react'
import Render from './components/Render'
import styled from 'styled-components'
import './App.css'

// External modules
import Voice from '../viardot'
import * as RITA from 'rita'

const InputField = styled.input`
  border-radius: 25px;
  background-color: black;
  opacity: 50%;
  height: 40px;
`

const Title = styled.h1`
  font-size: 9em;
  opacity: 15%;
  position: absolute;
`

const Toggle = styled.input`
  height: 40px;
  width: 40px;
`

export default function App() {
  const [voice, setVoice] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    setVoice(new Voice((e) => setReady(true)))
  },[])

  if (!ready) return null

  var onMouseMove = (e) => {
    var intensity = (e.screenX / window.innerWidth)
    var frequency = 440 + (1 - e.screenY / window.innerHeight) * 440
    voice.setFrequency(frequency)
    voice.setIntensity(intensity)
    // voice.setFrequency(220)
  }

  return (
    <div className="App" onMouseMove={onMouseMove}>
      <header className="App-header">
        <Title>Viardot</Title>
        <Input voice={voice}/>
        <PhonemeSelection voice={voice}/>
        {/* <TractUI voice={voice}/> */}
      </header>
    </div>
  )
}

function Input(p) {
  const [IPA, setIPA] = useState('')
  const [tongueIndex, setTongueIndex] = useState(0)
  const [tongueDiameter, setTongueDiameter] = useState(0)
  const [lipIndex, setLipIndex] = useState(0)
  const [lipDiameter, setLipDiameter] = useState(0)

  var onTongueIndex = (e) => {
    var value = e.target.value
    p.voice.setIndex(value)
    setTongueIndex(value)
  }

  var onTongueDiameter = (e) => {
    var value = e.target.value
    p.voice.setDiameter(value)
    setTongueDiameter(value)
  }

  var onLipIndex = (e) => {
    var value = e.target.value
    p.voice.tract.tipIndex.value = value
    setLipIndex(value)
  }

  var onLipDiameter = (e) => {
    var value = e.target.value
    p.voice.tract.tipDiameter.value = value
    setLipDiameter(value)
  }

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
      <label>Tongue Index
        <input onInput={onTongueIndex} type="range" min='0' max='1' step='0.01'/>
        <p>{tongueIndex}</p>
      </label>
      
      <label>Tongue Diameter
        <input onInput={onTongueDiameter} type="range" min='0' max='1' step='0.01'/>
        <p>{tongueDiameter}</p>
      </label>
      <Render/>

      <InputField onChange={onChange} placeholder='Enter text'/>
      <p id="values">{IPA}</p>
      <Toggle type='checkbox' onChange={toggleVoice}/>
    </div>
  )
}

function PhonemeSelection(p) {
  const phonemeDict = Voice.getPhonemeDict()
  const phonemes = Object.keys(phonemeDict).map((phone) =>
    <option key={phone} value={phone}>{phone}</option>
  )

  var onChange = (e) => (p.voice.setPhoneme(e.target.value))

  return (
    <select onChange={onChange} name="phonemes" id="phonemes">{phonemes}</select>
  )
}