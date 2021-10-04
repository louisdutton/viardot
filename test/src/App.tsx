import { useState, useEffect, useRef } from 'react'
import './App.css'
import * as VRD from '../../src/index' // testing dir

function App() {
  const canvasRef = useRef()
  const lerp = (a: number, b: number, t: number) => a * (1-t) + b * t
  const clamp = (value: number, a: number, b: number) => Math.min(Math.max(value, a), b)
  const analyser = VRD.context.analyser
  const bufferLength = VRD.context.bufferLength
  const dataArray = VRD.context.dataArray
  
  const draw = () => {
    requestAnimationFrame(draw);
  
    analyser.getByteFrequencyData(dataArray);
    const canvas = canvasRef.current! as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!

    const scale = window.devicePixelRatio
    canvas.width = (window.innerWidth * scale) >> 0
    canvas.height = (window.innerHeight * scale) >> 0
    ctx.scale(scale, scale)
  
    ctx.lineWidth = 1;
    // ctx.strokeStyle = "#0fa";
    ctx.fillStyle = "#0fa";
    ctx.imageSmoothingEnabled = false
  
    var sliceWidth = canvas.width / bufferLength;
    var x = 0;

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (var i = 1; i < bufferLength; i++) {
      var y = canvas.height/2 - dataArray[i] + 3;
      ctx.lineTo(x, y);
  
      x += sliceWidth;
    }
  
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.fill();
    ctx.stroke();
  }

  useEffect(() => {
    VRD.start()
    VRD.context.setReverb(.6, 2000, .2, .8)

    const voice = new VRD.Voice(VRD.Fach.Baritone)
    const phonemes = [
      VRD.Phonemes.aa,
      VRD.Phonemes.ah,
      VRD.Phonemes.iy,
      VRD.Phonemes.ao,
      VRD.Phonemes.uw
    ]

    draw()

    // events
    const mouse = { x:0, y:0 }
    window.onmousedown = e => voice.start()
    window.onmouseup = e => voice.stop()
    window.onmousemove = e => {
      // calculate normalized mouse position
      mouse.y = 1-e.clientY/window.innerHeight 
      mouse.x = e.clientX/window.innerWidth

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

      // update voice
      voice.setFrequency(300 * mouse.y)
      voice.setPhoneme(phoneme)
    }
  })

  const letters = ['a', 'e', 'i', 'o', 'u']
  // const [state, setState]

  return (
    <div className="App">
      <canvas style={{position: 'absolute', top: 0, left: 0, width: 'vw', height: 100 + 'vh'}} ref={canvasRef} />
      <main className="main">
        {letters.map((letter, i) => <Letter key={letter} value={letter}/>)}
      </main>
    </div>
  )
}

const Letter = (props: any) => {
  return <div className='phoneme'>{props.value}</div>
}

export default App
