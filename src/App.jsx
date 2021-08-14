import React, { useState, useEffect } from 'react'
import Render from './components/Render'
import GUI from './components/GUI'
import Voice from './viardot/viardot'
import './App.css'

export default function App() {
  const [voice, setVoice] = useState()
  const [ready, setReady] = useState(false)
  const [render, setRender] = useState(false)
  const [gui, setGui] = useState(false)

  useEffect(()=>{
    setVoice(new Voice(() => setReady(true)))
  },[])

  if (!ready) return <div className="App"/>

  const onMouseMove = (e) => {
    var intensity = (e.screenX / window.innerWidth)
    var f0 = (1 - e.screenY / window.innerHeight)
    voice.setIntensity(intensity)
    voice.setFrequency(f0)
  }

  return (
    <div className="App"
      onMouseMove={onMouseMove}
      onMouseDown={() => {voice.start()}}
      onMouseUp={() => {voice.stop()}}
      onMouseLeave={() => {voice.stop()}}>
      <Render voice={voice}/>
      <GUI voice={voice}/>
    </div>
  )
}

