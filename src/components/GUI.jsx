import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import eventBus from '../EventBus'
import { BiInfoCircle } from 'react-icons/bi'
import * as RITA from 'rita'
import { phonemeDict } from '/viardot'

const InfoWrapper = styled.div`
  position: absolute;
  height: 40px;
  width: 40px;
  left: 5%;
  top: 5%;
`

const InputField = styled.input`
  position: absolute;
  left: 50%;
  bottom: 5%;
  transform: translateX(-50%);
  border-radius: 25px;
  background-color: black;
  opacity: 50%;
  height: 40px;
`

const Values = styled.p`
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  background: none;
  color: white;
`

const Phonemes = styled.select`
  position: absolute;
  right: 5%;
  bottom: 15%;
  width: 40px;
  background: none;
  color: white;
`

export default function GUI(props) {
  const onChange = (e) => {
    var v = parseInt(e.target.value)
    if (isNaN(v)) return
    props.setSeed(v)
  }

  return (<div className='fade-in'>
      <InfoWrapper>
        <button onClick={() => console.log('test')}>
          <BiInfoCircle/>
        </button>
      </InfoWrapper>
      <Input voice={props.voice}/>
      <PhonemeSelection voice={props.voice}/>
    </div>)
}

function Input(props) {
  const [state, setState] = useState({ipa: 'ipa'})

  const onChange = (e) => {
    var phones = RITA.phones(e.target.value)
    setState({ipa: phones})
    // p.voice.recieve(phones)
  }

  return (
    <div className='Input'>
      <InputField onChange={onChange} placeholder='Enter text'/>
      <Values>{state.ipa}</Values>
    </div>
  )
}

function PhonemeSelection(p) {
  const phonemes = Object.keys(phonemeDict).map((phone) =>
    <option key={phone} value={phone}>{phone}</option>
  )

  const setPhoneme = (e) => {
    eventBus.dispatch("setPhoneme", { phoneme: e.target.value });
    p.voice.setPhoneme(e.target.value)
  }

  return <Phonemes onChange={setPhoneme}>{phonemes}</Phonemes>
}
