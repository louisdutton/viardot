import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useLoader, Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import eventBus from '../EventBus'

const visemeDict = {
  'zh': 'viseme_sil',
  'p': 'viseme_PP',
  'f': 'viseme_FF',
  'th': 'viseme_TH',
  'd': 'viseme_DD',
  'k': 'viseme_kk',
  'ch': 'viseme_CH',
  's': 'viseme_SS',
  'n':  'viseme_nn',
  'r':  'viseme_RR',
  'aa':  'viseme_aa',
  'ah':  'viseme_E',
  'iy': 'viseme_I',
  'ao': 'viseme_O',
  'uw': 'viseme_U'
}

function Head(props) {
  const scene = useLoader(GLTFLoader, '/assets/viardot.glb').scene
  const [state, setState] = useState({head: null, mouth: null})

  const [viseme, setViseme] = React.useState(0)
  const { viewport } = useThree();
  const ref = useRef()
  const t = 0.1

  const setMorphTarget = (value) => {
    var index = viseme
    nodes[0].morphTargetInfluences[index] = value
    nodes[1].morphTargetInfluences[index] = value
  }
  
  const visemeIndex = (phoneme) => {
    // nodes[0].morphTargetInfluences.forEach(x => x = 0)
    // nodes[1].morphTargetInfluences.forEach(x => x = 0)
    var viseme = visemeDict[phoneme]
    var index = state.head.morphTargetDictionary[viseme]
    // console.log(phoneme, viseme, index)
    return index
  }

  useEffect(() => {
    eventBus.add('setPhoneme', ({phoneme}) => setViseme(visemeIndex(phoneme)))

    var nodes = []
    var eyes = []
    scene.traverse(function(node) {
      if (node.morphTargetInfluences) nodes.push(node)
      if (node instanceof THREE.Bone && node.name.includes('Eye')) eyes.push(node)
    })
    setState({head: nodes[0], mouth: nodes[1], eyes: eyes})
    // console.log(eyes)

    return () => eventBus.remove('setPhoneme')
  }, [])

  var x, y, rX, rY, rot, newRot
  useFrame(({ mouse }) => {
    // mouth
    x = (mouse.x * viewport.width) / 2
    y = (mouse.y * viewport.height) / 2

    // setMorphTarget((x+0.5)*2)

    // linear interpolate rotation
    rot = ref.current.rotation
    rX = -y/3
    rY = x/2
    newRot = new THREE.Vector3(rot.x * (1-t) + rX * t, rot.y * (1-t) + rY * t, 0)
    ref.current.rotation.set(newRot.x, newRot.y, newRot.z) 

    // Eyes
    state.eyes[0].rotation.x = -Math.PI/2.2 + (Math.PI/1.5) * rX
    state.eyes[0].rotation.z = Math.PI + (Math.PI/1.5) * rY
    state.eyes[1].rotation.x = -Math.PI/2.2 + (Math.PI/1.5) * rX
    state.eyes[1].rotation.z = Math.PI + (Math.PI/1.5) * rY
  })

  return <primitive object={scene} ref={ref} position={[0, -0.6, 0]}/>
}

export default function Render(props) {
  return (
    <Canvas className='render'
      style={{width: '500px', height: '500px'}}
      dpr={ window.devicePixelRatio }
      camera={{ aspectRatio: 1, fov: 30, position: [0, 0, 1.2]}}
    >
      <ambientLight intensity={0.2}/>
      <pointLight position={[-5, 2, -7]} intensity={2} color={'magenta'}/>
      <pointLight position={[5, 5, -5]} intensity={2} color={'cyan'}/>
      <pointLight position={[5, 4, 5]} intensity={1}/>
      <Suspense fallback={null}>
       <Head voice={props.voice}/>
      </Suspense>
    </Canvas>
  )
}