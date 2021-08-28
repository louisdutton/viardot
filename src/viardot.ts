/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Based on Pink Trombone by Neil Thapen
* attribution is greatly appreciated.
*/

import { 
  AudioContext, 
  GainNode,
  AudioBufferSourceNode, 
  BiquadFilterNode, 
  TBiquadFilterType, 
} from 'standardized-audio-context'
import { 
  TractFilterNode, 
  GlottisNode, 
  AspiratorNode, 
  NoiseModulatorNode 
} from './nodes'

const workletPath = 'worklets/'

/**
 * Voice type from highest to lowest:
 * 
 * Soprano, Mezzo, Tenor, Baritone, Bass.
 */
 export enum FACH {
  SOPRANO = 'soprano',
  MEZZO = 'mezzo',
  TENOR = 'tenor',
  BARITONE ='baritone',
  BASS = 'bass',
}

// Phoneme: [index, diameter]
export const phonemeDict: { [key: string]: number[] } = {
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

const arpaToIPA: { [key: string]: string } = {
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

/**
 * Collection of 4 @link Voice
 */
export class Quartet {
  voices: Voice[]

  constructor() {
    this.voices = [
      new Voice(FACH.SOPRANO),
      new Voice(FACH.MEZZO),
      new Voice(FACH.TENOR),
      new Voice(FACH.BASS),
    ]
  }
}

/**
 * Monophonic vocal instrument.
 * @example 
 * const voice = new Voice(FACH.SOPRANO)
 * voice.on('C4')
 */
export class Voice {   
  ctx: AudioContext
  master!: GainNode<AudioContext>
  sampleRate: number
  tract!: TractFilterNode
  glottalSource!: GainNode<AudioContext>
  glottalExcitation!: GlottisNode
  aspirator!: AspiratorNode
  aspirationGain!: GainNode<AudioContext>
  aspirationFilter!: BiquadFilterNode<AudioContext>
  fricativeGain!: GainNode<AudioContext>
  fricativeFilter!: BiquadFilterNode<AudioContext>
  noise!: AudioBufferSourceNode<AudioContext>
  noiseModulator!: NoiseModulatorNode
  
  /**
   * 
   * @param  {FACH}     fach        Voice type
   * @param  {Function} onComplete  Completion callback
   */
  constructor(fach:FACH, onComplete?:Function) {
    this.ctx = new AudioContext()
    this.ctx.suspend()
    this.sampleRate = this.ctx.sampleRate
    
    // async import custom audio nodes
    console.log('[viardot] Initializing...')
    const audioWorklet = this.ctx.audioWorklet
    const modules = ['tract', 'noise-modulator', 'aspirator', 'glottis']
    Promise.all(modules.map(m => 
      audioWorklet?.addModule(workletPath + m + '.js'))
    ).then(() => this.init()).then(() => this.onComplete(onComplete))
  }

  onComplete(callback?: Function) {
    console.log('[viardot] Intialization complete.')
    if (callback) callback()
  }

  init() {
    // master gain
    this.master = this.ctx.createGain()
    this.master.gain.setValueAtTime(0.05, this.ctx.currentTime)
    this.master.connect(this.ctx.destination)

    this.tract = new TractFilterNode(this.ctx)
    this.tract.connect(this.master)
    // setInterval(() => this.tract.port.postMessage(0), 100)
    
    // Glottal source
    this.glottalSource = this.ctx.createGain()
    this.glottalSource.connect(this.tract)
    this.glottalExcitation = new GlottisNode(this.ctx)
    this.glottalExcitation.connect(this.glottalSource)
    
    // Noise source
    this.initNoise(2)
  }

  setNasal(value: number) {
    this.tract.port.postMessage(value)
  }

  setFrequency(value: number) {
    const freq = 440 + value * 880
    this.noiseModulator.frequency.value = freq
    this.glottalExcitation.frequency.value = freq
    this.aspirationFilter.frequency.value = freq
  }

  setIntensity(value: number) {
    const tenseness = value * 0.3
    this.glottalExcitation.tenseness.value = value * 0.4
    this.glottalExcitation.loudness.value = Math.pow(value, 0.25)
    this.aspirator.tenseness.value = tenseness
    this.noiseModulator.tenseness.value = tenseness
  }

  initNoise(duration: number) {
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
    this.fricativeFilter = this.createFilter(1000, 0.7)
    this.fricativeFilter.connect(this.fricativeGain)
  }

  createFilter(frequency: number, q=0.67, type:TBiquadFilterType='bandpass') {
    const filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = q
    this.noise.connect(filter)
    return filter
  }

  whiteNoiseBuffer(duration: number, sampleRate: number)
  {
    const bufferSize = duration * sampleRate; // duration * sampleRate
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    buffer.getChannelData(0).forEach(v => v = Math.random() * 2 - 1)
    return buffer
  }

  static getPhonemeDict = () => phonemeDict

  setPhoneme(key:string) {
    const values = phonemeDict[key]
    this.setTongue(values[0], values[1])
  }

  setTongue(index: number, diameter: number, t = 0.3) {
    this.tract.tongueIndex.value = index
    this.tract.tongueDiameter.value = diameter
  }

  setIndex(index: number, t = 0.3) {
    this.tract.tongueIndex.value = index
  }

  setDiameter(diameter: number, t = 0.3) {
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

  recieve = (phones: any) => {console.log(phones)}
}