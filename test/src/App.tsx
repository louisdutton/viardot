import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Note, Chord, ChordDictionary } from "@tonaljs/tonal"
import * as VRD from '../../src/index' // testing dir

const voices = [
  new VRD.Voice(VRD.Fach.Soprano),
  new VRD.Voice(VRD.Fach.Contralto),
  new VRD.Voice(VRD.Fach.Tenor),
  new VRD.Voice(VRD.Fach.Bass)
]

const colors = ['#d400ff', '#0099ff', '#00ffaa', '#ff9100']
const letters = ['a', 'e', 'i', 'o', 'u']

const lerp = (a: number, b: number, t: number) => a * (1-t) + b * t
const clamp = (value: number, a: number, b: number) => Math.min(Math.max(value, a), b)

function App() {
  const canvasRef = useRef()

  const draw = () => {
    requestAnimationFrame(draw);
    
    const canvas = canvasRef.current! as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const scale = window.devicePixelRatio
    canvas.width = (window.innerWidth * scale) >> 0
    canvas.height = (window.innerHeight * scale) >> 0
    ctx.scale(scale, scale)

    ctx.lineWidth = 2;
    ctx.imageSmoothingEnabled = false

    for (let i = 0; i < voices.length; i++) {
      const v = voices[i];
      ctx.strokeStyle = colors[i];
      ctx.fillStyle = colors[i] + '77';

      const analyser = v.analyser
      const bufferLength = v.bufferLength
      const dataArray = v.dataArray
      analyser.getByteFrequencyData(dataArray)

      const sliceWidth = canvas.width / bufferLength;

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let n = 1, x = 0; n < bufferLength; n++) {
        const y = canvas.height/2 - dataArray[n] + 3;
        ctx.lineTo(x, y);
        x+=sliceWidth
      }
    
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.fill();
    }
  }

  useEffect(() => {
    VRD.start()
    VRD.context.setReverb(.65, 2500, .2, .0)

    const phonemes = [
      VRD.Phonemes.aa,
      VRD.Phonemes.ah,
      VRD.Phonemes.iy,
      VRD.Phonemes.ao,
      VRD.Phonemes.uw
    ]

    draw()

    // events
    const mouse = { x: 0, y: 0 }
    window.onmousedown = e => voices.forEach(v => {
      if (v.enabled) v.start()
    })
    window.onmouseup = e => voices.forEach(v => v.stop())
    window.onmousemove = e => {
      // calculate normalized mouse position
      mouse.y = clamp(1-e.clientY/window.innerHeight, 0, 1)
      mouse.x = clamp(e.clientX/window.innerWidth, 0, 1)

      // calculate phomeme interpolation
      const x = clamp(mouse.x - .1, 0, 1)
      const pos = phonemes.length * x
      const i1 = pos >> 0
      const i2 = (pos + 1) >> 0
      const p1 = phonemes[i1]
      const p2 = phonemes[i2]
      const interpolant = pos-i1
      const phoneme = [
        lerp(p1[0], p2[0], interpolant),
        lerp(p1[1], p2[1], interpolant),
        lerp(p1[2], p2[2], interpolant)
      ]

      // update voices
      voices.forEach(v => {
        const baseFreq = v.range.bottom + (v.range.top-v.range.bottom) * mouse.y
        const note = Note.fromFreq(baseFreq)
        const freq = Note.freq(note)
        v.setFrequency(baseFreq)
        v.setPhoneme(phoneme)
      })
    }
  },[])

  return (
    <div className="App">
      <canvas style={{position: 'absolute', top: 0, left: 0, width: 'vw', height: 100 + 'vh'}} ref={canvasRef} />
      <main className="main">
        {letters.map((letter, i) => <Letter key={letter} value={letter}/>)}
      </main>
      <Voices />
      <Controls />
    </div>
  )
}

const Letter = (props: any) => {
  return <span className='phoneme'>{props.value}</span>
}

const Voices = (props: any) => {
  return (
    <div className='voice-panel'>
      {voices.map((v, i) => <VoiceToggle key={i} voice={v} color={colors[i]}/>)}
    </div>
  )
}

const Controls = (props: any) => {
  const setLoudness = e => {
    const value = parseFloat(e.target.value)
    console.log(value)
    voices.forEach(v => v.setLoudness(value))
  }

  return (
    <div className='control-panel'>
      <input type="range" min={0} max={1} step={0.01} defaultValue={.5} onChange={e => setLoudness(e)}/>
    </div>
  )
}

const VoiceToggle = (props: any) => {
  const textStyle = {
    color: props.color
  }

  const buttonStyle = {
    background: props.color,
    borderColor: props.color
  }

  const onChange = e => props.voice.enabled = e.target.checked

  return (
    <div className='voice-toggle'>
      <input type='checkbox' style={buttonStyle} className='toggle' defaultChecked={true} onChange={e => onChange(e)}/>
      <p style={textStyle} className="name">{VRD.Fach[props.voice.fach]}</p>
    </div>
  )
}

export default App
