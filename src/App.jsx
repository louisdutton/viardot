import React, { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { Component } from 'react';
import { render } from 'react-dom';
import * as THREE from "three";
import * as VIARDOT from '../viardot';

class App extends Component {
  constructor() {
    super()
    this.voice = new VIARDOT.Voice()
  }

  onMouseDown = () => {
      this.voice.start();
  }

  render() {
    // const [count, setCount] = useState(0)

    return (
      <div onMouseDown={this.onMouseDown} className="App">
        <Render className="App-logo"/>
        <header className="App-header">
          <h1>Viardot</h1>
          <Input/>
        </header>
        
      </div>
    )
  }
}

class Render extends Component {
  componentDidMount() {
    // === THREE.JS CODE START ===
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    this.mount.appendChild( renderer.domElement );
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial();
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
    camera.position.z = 5;
    var animate = function () {
      requestAnimationFrame( animate );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render( scene, camera );
    };

    animate();
  }

  render() {
    return (
      <div className='Render' ref={ref => (this.mount = ref)} />
    )
  }
}

class Input extends Component {
  state = {
    input: ''
  }

  onChange = (e) => {
    // console.log(e.target.value);
    var words = e.target.value.split(/ /);
    var ipa = '';
    words.forEach(word => { ipa += VIARDOT.toPhonemes(word, true) + ' '; });
    this.setState({input : ipa})
  }

  render() {
    return (
      <div className='Input'>
        <input onChange={this.onChange} placeholder="Enter transcription text" name="word"/>
        <p id="values">{this.state.input}</p>
      </div>
    )
  }
}

export default App
