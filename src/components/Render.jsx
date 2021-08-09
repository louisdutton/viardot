import React, { Suspense, useRef } from 'react'
import { useLoader, Canvas, useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Color, Vector3 } from 'three'
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styled from 'styled-components'

const Frame = styled(Canvas)`
  width: 500px;
  height: 500px;
  background: none;
`

function Head() {
  // const mesh = useLoader(FBXLoader, '/assets/head.fbx').children[0]
  const scene = useLoader(GLTFLoader, '/assets/viardot.glb').scene
  const nodes = []
  scene.traverse(function(node) {
    if (node.morphTargetInfluences) nodes.push(node)
  })

  const { camera, gl, mouse, viewport } = useThree();
  const ref = useRef()
  const t = 0.1

  var setMorph = (name, value) => {
    var index = nodes[0].morphTargetDictionary[name]
    nodes[0].morphTargetInfluences[index] = value
    nodes[1].morphTargetInfluences[index] = value
  }

  var x;
  var y;
  useFrame(({ mouse }) => {
    x = (mouse.x * viewport.width) / 2
    y = (mouse.y * viewport.height) / 2

    // linear interpolate rotation
    var rot = ref.current.rotation
    var rX = -y/2
    var rY = x/2
    var newRot = new Vector3(rot.x * (1-t) + rX * t, rot.y * (1-t) + rY * t, 0)
    ref.current.rotation.set(newRot.x, newRot.y, newRot.z) 
  })

  return (
    <primitive 
      object={scene}
      ref={ref}
      scale={1, 1, 1}
      position={[0, -0.6, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

export default function Render(props) {
  return (
    <Frame 
      style={{width: '500px', height: '500px'}}
      dpr={ window.devicePixelRatio }
      camera={{ aspectRatio: 1, fov: 30, position: [0, 0, 1.2]}}
    >
      <ambientLight intensity={0.2}/>
      <pointLight position={[-5, 2, -7]} intensity={2} color={'magenta'}/>
      <pointLight position={[5, 5, -5]} intensity={2} color={'cyan'}/>
      <pointLight position={[5, 4, 5]} intensity={0.5}/>
      <Suspense fallback={null}>
       <Head/>
      </Suspense>
    </Frame>
  )
}