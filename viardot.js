/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Based on Pink Trombone by Neil Thapen 
* attribution is appreciated.
*/

// Phoneme: [index, diameter]
const dict = {
  // vowels
  'aa': [0.84, 0.73], // part
  'ah': [0.84, 0.55], // pet
  'ae': [35.93, 2.6], // pat ???????
  'uh': [33.8, 2], // put
  'ao': [0.79, 0.76], // pot
  'ax': [30.7, 2.1], // dial
  'oh': [5.7, 2], // daughter
  'uw': [2.8, 2.1], // poot
  'ih': [24.8, 2.6], // pit
  'iy': [0.72, 0.22], // peat

  // fricatives
  'sh': [33.98, 0.5], // shell
  'zh': [34.7, 0.65], // pleasure
  's': [37.8, 0.5], // soon
  'z': [38, 0.75], // zoo
  'f': [41.0, 0.6], // fair
  'v': [41.0, 0.6], // very

  // stops
  'g': [20.0, 0], // go
  'k': [25.0, 0], // king
  'd': [36.0, 0], // den
  't': [37.0, 0], // ten
  'b': [41.0, 0], // bad
  'p': [42.0, 0], // pad

  // nasals
  'ng': [20.0, -1], // thing
  'n': [36.0, -1], // not
  'm': [41.0, -1], // man

}

import * as Nodes from './worklets/worklet-nodes'
import * as Freeverb from 'freeverb'

export default class Voice {   
  constructor(onComplete) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    this.ctx = new window.AudioContext()   
    this.ctx.suspend()
    this.sampleRate = this.ctx.sampleRate
    
    // async import custom audio nodes
    console.log('[viardot] Initializing...')
    var audioWorklet = this.ctx.audioWorklet
    Promise.all([
      audioWorklet.addModule('worklets/tract.js'),
      audioWorklet.addModule('worklets/noise-modulator.js'),
      audioWorklet.addModule('worklets/aspirator.js'),
      audioWorklet.addModule('worklets/glottis.js'),
    ]).then(() => this.init()).then(() => this.onComplete(onComplete))
  }

  onComplete(callback) {
    console.log('[viardot] Intialization complete.')
    callback()
  }

  init() {
    // master gain
    this.master = this.ctx.createGain()
    this.master.gain.setValueAtTime(0.05, this.ctx.currentTime)
    this.master.connect(this.ctx.destination)

    this.reverb = new Freeverb(this.ctx)
    this.reverb.roomSize = 0.7
    this.reverb.dampening = 3000
    this.reverb.wet.value = 0.15
    this.reverb.dry.value = 0.85
    this.reverb.connect(this.master)

    this.tractData = []
    this.tract = new Nodes.TractFilterNode(this.ctx)
    this.tract.connect(this.reverb)
    setInterval(() => this.tract.port.postMessage(0), 100)
    
    // Glottal source
    this.glottalSource = this.ctx.createGain()
    this.glottalSource.connect(this.tract)
    this.glottalExcitation = new Nodes.GlottisNode(this.ctx)
    this.glottalExcitation.connect(this.glottalSource)
    
    // Noise source
    this.initNoise(2)
  }

  setNasal(value) {
    this.tract.port.postMessage(value)
  }

  setVowel(vowel) {

  }

  setFrequency(value) {
    this.noiseLFO.frequency.value = value
    this.glottalExcitation.frequency.value = value
  }

  setIntensity(value) {
    var tenseness = value * 0.3
    this.glottalExcitation.tenseness.value = tenseness / 2
    this.glottalExcitation.loudness.value = Math.pow(value, 0.25)
    this.glottalExcitation.intensity.value = value * 0.2
    // this.glottalExcitation.vibratoRate.value = value * 10

    this.aspirator.tenseness.value = tenseness
    this.aspirator.intensity.value = value

    this.noiseModulator.tenseness.value = tenseness
    this.noiseModulator.intensity.value = value
  }

  initNoise(duration) {
    this.aspirationGain = this.ctx.createGain()
    this.aspirationGain.connect(this.reverb)

    this.aspirator = new Nodes.AspiratorNode(this.ctx)
    this.aspirator.connect(this.aspirationGain)

    this.noise = this.ctx.createBufferSource()
    this.noise.buffer = this.createPinkNoise(duration, this.sampleRate)
    this.noise.loop = true
    this.noise.start()

    this.noiseModulator = new Nodes.NoiseModulatorNode(this.ctx)
    this.noiseModulator.connect(this.aspirationGain.gain)

    this.noiseLFO = this.createLFO(220, this.noiseModulator)
    this.noiseLFO.start()
    
    // filters
    this.fricativeGain = this.ctx.createGain()
    this.fricativeGain.connect(this.tract, 0, 1)
    this.noiseModulator.connect(this.fricativeGain.gain)
    this.aspirationFilter = this.createFilter(500, 0.6).connect(this.aspirator)
    this.fricativeFilter = this.createFilter(1000, 0.7).connect(this.fricativeGain)
  }

  createLFO(frequency, target) {
    var lfo = this.ctx.createOscillator()
    lfo.frequency.value = frequency
    lfo.connect(target)
    return lfo
  }

  createFilter(frequency, q = 0.67) {
    var filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = frequency
    filter.Q.value = q
    this.noise.connect(filter)
    return filter
  }

  // Paul Kellet's refined method
  createPinkNoise(duration, sampleRate)
  {
    var b0, b1, b2, b3, b4, b5, b6
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0

    var bufferSize = duration * sampleRate; // duration * sampleRate
    var buffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    var channel = buffer.getChannelData(0)
    for (var i = 0; i < bufferSize; i++) { 
      // var white = Math.random() * 2 - 1
      // b0 = 0.99886 * b0 + white * 0.0555179
      // b1 = 0.99332 * b1 + white * 0.0750759
      // b2 = 0.96900 * b2 + white * 0.1538520
      // b3 = 0.86650 * b3 + white * 0.3104856
      // b4 = 0.55000 * b4 + white * 0.5329522
      // b5 = -0.7616 * b5 - white * 0.0168980
      // channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      channel[i] = Math.random() * 2 - 1
      channel[i] *= 0.11 // (roughly) compensate for gain
      // b6 = white * 0.115926
    }
    return buffer
  }

  static getPhonemeDict = () => dict

  setPhoneme(key) {
    var values = dict[key]
    var phoneme = { // for logging purposes
      name: key,
      index: values[0],
      diameter: values[1]
    }

    console.log(phoneme)
    this.setTongue(phoneme.index, phoneme.diameter)
  }

  setTongue(index, diameter, t = 0.3) {
    this.tract.tongueIndex.value = index
    this.tract.tongueDiameter.value = diameter
  }

  setIndex(index, t = 0.3) {
    this.tract.tongueIndex.value = index
  }

  setDiameter(diameter, t = 0.3) {
    this.tract.tongueDiameter.value = diameter
  }
    
  start() { this.ctx.resume() }
  stop() { this.ctx.suspend() }

  recieve = (phones) => {console.log(phones)}
}