import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import './App.css'

// External modules
import Voice from '../viardot'
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
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    setVoice(new Voice((e) => setReady(true)))
  },[])

  if (!ready) return null

  var onMouseMove = (e) => {
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
        <PhonemeSelection voice={voice}/>
        {/* <TractUI voice={voice}/> */}
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

  var setNasal = (e) => {
    p.voice.setNasal(e.target.value)
  }

  return (
    <div className='Input'>
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

const TractUIWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 400px;
`

const DiameterUI = styled.div`
  background: white;
  border-radius: 50%;
  height: 5px;
  width: 5px;
  margin-top: ${props => (props.value * 100).toString() + 'px'};
`

function TractUI(p) {
  const [data, setData] = useState([])

  useEffect(()=>{
    p.voice.tract.port.onmessage = (e) => {
      setData(Array.from(e.data))
      // console.log(e.data[20])
    }
  },[])

  return (
    <TractUIWrapper>
      {data.map((value, key) =>
        <DiameterUI key={key} value={value}/>
      )}
    </TractUIWrapper>
  )

}
