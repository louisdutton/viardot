import React, { useState, useEffect } from 'react'
import Render from './components/Render'
import GUI from './components/GUI'
import styled from 'styled-components'
import './App.css'
import Voice from '../viardot'
import Anime from 'react-anime'

export default function App() {
  const [voice, setVoice] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    setVoice(new Voice((e) => setReady(true)))
  },[])

  if (!ready) return null

  const onMouseMove = (e) => {
    var intensity = (e.screenX / window.innerWidth)
    var frequency = 440 + (1 - e.screenY / window.innerHeight) * 440
    voice.setFrequency(frequency)
    voice.setIntensity(intensity)
    // voice.setFrequency(220)
  }

  return (
    <div className="App"
      onMouseMove={onMouseMove}
      onMouseDown={() => voice.start()}
      onMouseUp={() => voice.stop()}>
      <Title/>
      <Render voice={voice}/>
      <GUI voice={voice}/>
    </div>
  )
}

const Title = () => (
  <h1>
    <Anime easing='easeInOutElastic' duration={2250} delay={(el, i) => 100 * (i+1)} scale={[0.5, 1]}opacity={[0, 1]}>
      {'Viardot'.split('').map(function(char, index){
        return (<div key={index}>{char}</div>)
      })}
    </Anime>
  </h1>
)

