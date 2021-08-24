/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Based on Pink Trombone by Neil Thapen 
* attribution is appreciated.
*/

import * as Freeverb from 'freeverb'

class NoiseModulatorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.frequency = this.parameters.get('frequency')
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

class GlottisNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'glottis', { channelCount: 1, numberOfInputs: 0, numberOfOutputs: 1 })
    this.frequency = this.parameters.get('frequency')
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.loudness = this.parameters.get('loudness')
    this.vibratoRate = this.parameters.get('vibratoRate')
    this.vibratoDepth = this.parameters.get('vibratoDepth')
    this.active = false
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

class AspiratorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

class TractFilterNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'tract', { numberOfInputs: 2 })
    this.intensity = this.parameters.get('intensity')
    this.tenseness = this.parameters.get('tenseness')
    this.tongueIndex = this.parameters.get('tongueIndex')
    this.tongueDiameter = this.parameters.get('tongueDiameter')
    this.tipIndex = this.parameters.get('tipIndex')
    this.tipDiameter = this.parameters.get('tipDiameter')
  }
}

// Phoneme: [index, diameter]
export const phonemeDict = {
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
  'p': [0.99, 0], // pad

  // nasals
  'ng': [20.0, -1], // thing
  'n': [36.0, -1], // not
  'm': [0.8, -1], // man
}

const arpaToIPA = {
  'aa':	'ɑ',
  'ae':	'æ',
  'ah':	'ʌ',
  'ao':	'ɔ',
  'aw':	'aʊ',
  'ax':	'ə',
  'ay':	'aɪ',
  'eh':	'ɛ',
  'er':	'ɝ',
  'ey':	'eɪ',
  'ih':	'ɪ',
  'ix':	'ɨ',
  'iy':	'i',
  'ow':	'oʊ',
  'oy':	'ɔɪ',
  'uh':	'ʊ',
  'uw':	'u',
  'b': 'b',
  'ch':	'tʃ',
  'd':	'd',
  'dh':	'ð',
  'dx':	'ɾ',
  'el':	'l̩',
  'em':	'm̩',
  'en':	'n̩',
  'f': 'f',
  'g': 'ɡ',
  'hh':	'h',
  'jh': 'dʒ',
  'k':	'k',
  'l':	'l',
  'm':	'm',
  'n':	'n',
  'ng':	'ŋ',
  'p':	'p',
  'q':	'ʔ',
  'r':	'ɹ',
  's':	's',
  'sh':	'ʃ',
  't':	't',
  'th':	'θ',
  'v':	'v',
  'w':	'w',
  'wh':	'ʍ',
  'y':	'j',
  'z':	'z',
  'zh':	'ʒ',
}


const workletPath = 'worklets/'

export class Voice {   
  constructor(onComplete) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    this.ctx = new window.AudioContext()   
    this.ctx.suspend()
    this.sampleRate = this.ctx.sampleRate
    
    // async import custom audio nodes
    console.log('[viardot] Initializing...')
    var audioWorklet = this.ctx.audioWorklet
    var modules = ['tract', 'noise-modulator', 'aspirator', 'glottis']
    Promise.all(modules.map(m => 
      audioWorklet.addModule(workletPath + m + '.js'))
    ).then(() => this.init()).then(() => this.onComplete(onComplete))
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
    this.reverb.roomSize = 0.6
    this.reverb.dampening = 3000
    this.reverb.wet.value = 0.15
    this.reverb.dry.value = 0.85
    this.reverb.connect(this.master)

    this.tractData = []
    this.tract = new TractFilterNode(this.ctx)
    this.tract.connect(this.reverb)
    setInterval(() => this.tract.port.postMessage(0), 100)
    
    // Glottal source
    this.glottalSource = this.ctx.createGain()
    this.glottalSource.connect(this.tract)
    this.glottalExcitation = new GlottisNode(this.ctx)
    this.glottalExcitation.connect(this.glottalSource)
    
    // Noise source
    this.initNoise(2)
  }

  setNasal(value) {
    this.tract.port.postMessage(value)
  }

  setFrequency(value) {
    var freq = 440 + value * 880
    this.noiseModulator.frequency.value = freq
    this.glottalExcitation.frequency.value = freq
    this.aspirationFilter.frequency.value = freq
    // this.glottalExcitation.vibratoRate.value = 6 + value * 1
    // this.glottalExcitation.vibratoDepth.value = 6 + value * 7
  }

  setIntensity(value) {
    var tenseness = value * 0.3
    this.glottalExcitation.tenseness.value = value * 0.4
    this.glottalExcitation.loudness.value = Math.pow(value, 0.25)
    this.aspirator.tenseness.value = tenseness
    this.noiseModulator.tenseness.value = tenseness
  }

  initNoise(duration) {
    this.aspirationGain = this.ctx.createGain()
    this.aspirationGain.connect(this.glottalSource)

    this.aspirator = new AspiratorNode(this.ctx)
    this.aspirator.connect(this.aspirationGain)

    this.noise = this.ctx.createBufferSource()
    this.noise.buffer = this.whiteNoiseBuffer(duration, this.sampleRate)
    this.noise.loop = true
    this.noise.start()

    this.noiseModulator = new NoiseModulatorNode(this.ctx)
    this.noiseModulator.connect(this.aspirationGain.gain)
    
    // filters
    this.fricativeGain = this.ctx.createGain()
    this.fricativeGain.connect(this.tract, 0, 1)
    this.noiseModulator.connect(this.fricativeGain.gain)
    this.aspirationFilter = this.createFilter(600, 0.9, 'lowpass')
    this.aspirationFilter.connect(this.aspirator)
    this.fricativeFilter = this.createFilter(1000, 0.7).connect(this.fricativeGain)
  }

  createLFO(frequency, target) {
    var lfo = this.ctx.createOscillator()
    lfo.frequency.value = frequency
    lfo.connect(target)
    return lfo
  }

  createFilter(frequency, q=0.67, type='bandpass') {
    var filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = q
    this.noise.connect(filter)
    return filter
  }

  // Paul Kellet's refined method
  whiteNoiseBuffer(duration, sampleRate)
  {
    var bufferSize = duration * sampleRate; // duration * sampleRate
    var buffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    var channel = buffer.getChannelData(0)
    for (var i = 0; i < bufferSize; i++) { 
      channel[i] = Math.random() * 2 - 1
      // channel[i] *= 0.5 // (roughly) compensate for gain
    }
    return buffer
  }

  static getPhonemeDict = () => phonemeDict

  setPhoneme(key) {
    var values = phonemeDict[key]
    this.setTongue(values[0], values[1])
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

  getIntensity = () => this.glottalExcitation.tenseness.value
    
  start() {
    this.ctx.resume() 
    this.glottalExcitation.start(this.ctx.currentTime)
    this.noiseModulator.start(this.ctx.currentTime)
    this.aspirator.start(this.ctx.currentTime)
  }
  stop = () => {
    this.glottalExcitation.stop(this.ctx.currentTime)
    this.noiseModulator.stop(this.ctx.currentTime)
    this.aspirator.stop(this.ctx.currentTime)
  }

  recieve = (phones) => {console.log(phones)}
}