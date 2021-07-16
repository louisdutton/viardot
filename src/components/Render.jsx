import React, { useState } from 'react'
import { Component } from 'react'
import * as THREE from "three"
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

class Render extends Component {
  componentDidMount() {
    // === THREE.JS CODE START ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    this.mount.appendChild(renderer.domElement)
    var geometry = new THREE.BoxGeometry(1, 1, 1)
    var material = new THREE.MeshBasicMaterial()
    // var cube = new THREE.Mesh( geometry, material )
    // scene.add( cube )
    camera.position.z = 100
  
    const controls = new OrbitControls(camera, renderer.domElement);

    // lights 
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemiLight.position.set(0, 200, 0)
    scene.add(hemiLight)
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add( dirLight );

    // load model
    var loader = new FBXLoader()
    var texLoader = new THREE.TextureLoader()
    loader.load('./assets/louise/louise.fbx', function (object) {

      // mixer = new THREE.AnimationMixer( object );

      // const action = mixer.clipAction( object.animations[ 0 ] );
      // action.play();

      object.traverse(function(child) {

        if (child.isMesh) {
          // assign additional textures
          // child.material[0].map = texLoader.load('./assets/louise/Head_Diffuse.png')
          // child.material[0].aoMap = texLoader.load('./assets/louise/Head_AO.png')
          // child.material[0].bumpMap = texLoader.load('./assets/louise/Head_Normal.png')
          // child.material[0].specularMap = texLoader.load('./assets/louise/Head_Specular.png')
          // child.material[0].roughnessMap = texLoader.load('./assets/louise/Head_Roughness.png')
          // child.material[0].displacementMap = texLoader.load('./assets/louise/Head_Displacement.png')
          for (var i = 0; i < 8; i++) {
            child.material[i].wireframe = true;
            child.material[i].color = THREE.Color.white;
          }
          
          console.log(child.material)

          // lighting
          child.castShadow = true;
          child.receiveShadow = true;
        }

      } );

      scene.add( object );

    }, undefined, function ( e ) {

      console.error( e );
    
    });

    window.addEventListener( 'resize', onWindowResize )

    var onWindowResize = function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  
      renderer.setSize( window.innerWidth, window.innerHeight );
    }

    var animate = function () {
      requestAnimationFrame( animate )
      controls.update()
      renderer.render( scene, camera )
    };

    animate();
  }

  render() {
    return (
      <div className='Render' ref={ref => (this.mount = ref)} />
    )
  }
}

export default Render