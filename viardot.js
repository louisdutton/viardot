/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Based on Pink Trombone by Neil Thapen 
* attribution is appreciated.
*/

// Phoneme: [index, diameter]
const dict = {
  // vowels
  'aa': [2.3, 12.75], // part
  'ae': [14.93, 2.78], // pat
  'uh': [17.8, 2.46], // put
  'ao': [12.0, 2.05], // pot
  'ax': [20.7, 2.8], // dial
  'oh': [2.3, 12.75], // daughter
  'uw': [22.8, 2.05], // poot
  'ih': [26.11, 2.87], // pit
  'iy': [27.2, 2.2], // peat
  'eh': [19.4, 3.43], // pet

  // fricatives
  'zh': [31.0, 0.6], // pleasure
  's': [36.0, 0.2], // soon
  'z': [36.0, 0.6], // zoo
  'f': [41.0, 0.2], // fair
  'v': [41.0, 0.5], // very

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

  init(onComplete) {
    // master gain
    this.master = this.ctx.createGain()
    this.master.gain.setValueAtTime(0.05, this.ctx.currentTime)
    this.master.connect(this.ctx.destination)

    this.tractData = []
    this.tract = new Nodes.TractFilterNode(this.ctx)
    this.tract.connect(this.master)
    setInterval(() => this.tract.port.postMessage(0), 50)
    
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
    this.glottalExcitation.tenseness.value = value
    this.glottalExcitation.intensity.value = value
    // this.glottalExcitation.vibratoDepth

    this.aspirator.tenseness.value = value
    this.aspirator.intensity.value = value

    this.noiseModulator.tenseness.value = value
    this.noiseModulator.intensity.value = value
  }

  initNoise(duration) {
    this.aspirationGain = this.ctx.createGain()
    this.aspirationGain.connect(this.master)

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
    this.aspirationFilter = this.createFilter(500).connect(this.aspirator)
    this.fricativeFilter = this.createFilter(1000).connect(this.fricativeGain)
  }

  createLFO(frequency, target) {
    var lfo = this.ctx.createOscillator()
    lfo.frequency.value = frequency
    lfo.connect(target)
    return lfo
  }

  createFilter(frequency, q = 0.7) {
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
      var white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      channel[i] *= 0.11 // (roughly) compensate for gain
      b6 = white * 0.115926
      // channel[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  static getPhonemeDict() { return dict };
  setPhoneme(key) {
    var values = dict[key]
    var phoneme = { // for logging purposes
      name: key,
      index: values[0],
      diameter: values[1]
    }

    console.log(phoneme)
    this.tract.tongueIndex.value = phoneme.index
    this.tract.tongueDiameter.value = phoneme.diameter
  }
    
  start() { this.ctx.resume() }
  stop() { this.ctx.suspend() }

  recieve = (phones) => {console.log(phones)}
}