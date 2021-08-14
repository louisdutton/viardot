import React, { useState, useEffect } from 'react'
import eventBus from '../EventBus'
import { BiInfoCircle } from 'react-icons/bi'
import { phonemeDict, IPA } from '../viardot/viardot'
import * as RITA from 'rita'
import Anime from 'react-anime'
import ReactMarkdown from 'react-markdown'

const GUI = (props) => {
  const [state, setState] = useState({ipa: 'Viardot'})
  const infoURL = 'https://github.com/louisdutton/viardot'

  return(
    <div>
      <Title text={state.ipa}/>
      <button className='info-button' onClick={() => window.open(infoURL, '_blank')}><BiInfoCircle/></button>
      <Input voice={props.voice} callback={setState} className='fade-in'/>
      <PhonemeSelection voice={props.voice} className='fade-in'/>
    </div>
  )
}

function Input(props) {

  const onChange = (e) => {
    var value = e.target.value
    if (!value) return
    var phones = RITA.phones(value)
    var words = phones.split(/\s/)
    var phones = words[0].split(/-/).map(x => IPA[x]).join('')
    props.callback({ipa: phones})
    // p.voice.recieve(phones)
  }

  return <input className='text-input' onChange={onChange} placeholder='Enter text'/>
}

function PhonemeSelection(p) {
  const phonemes = Object.keys(phonemeDict).map((phone) =>
    <option key={phone} value={phone}>{phone} : {IPA[phone]}</option>
  )

  const setPhoneme = (e) => {
    eventBus.dispatch("setPhoneme", { phoneme: e.target.value });
    p.voice.setPhoneme(e.target.value)
  }

  return <select className='phoneme-select' onChange={setPhoneme}>{phonemes}</select>
}

const Title = (props) => (
  <h1>
    <Anime
    easing='easeOutElastic' duration={1500}
    delay={(el, i) => 100 * (i+1)}
    scale={[0.5, 1]} opacity={[0, 1]}>
      {
        props.text.split('').map(function(char, index){
        return (<div key={index}>{char}</div>)
      })}
    </Anime>
  </h1>
)


export default GUI
