/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Based on Pink Trombone by Neil Thapen
* attribution is greatly appreciated.
*/

import NoiseNode from './noise'
import { ArpaToIPA, PhonemeToTonguePosition } from './dictionaries'
import { 
  AudioContext, 
  GainNode,
} from 'standardized-audio-context'
import { 
  TractFilterNode, 
  GlottisNode, 
  AspiratorNode, 
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
  public readonly ctx: AudioContext
  public readonly master: GainNode<AudioContext>
  public readonly sampleRate: number
  private tract!: TractFilterNode
  private glottalGain!: GainNode<AudioContext>
  private glottalExcitation!: GlottisNode
  private aspirator!: AspiratorNode
  private aspirationGain!: GainNode<AudioContext>
  private noise!: NoiseNode
  
  /**
   * 
   * @param  {FACH}     fach        Voice type
   * @param  {Function} onComplete  Completion callback
   */
  constructor(fach:FACH, onComplete?:Function) {
    const ctx = new AudioContext()
    ctx.suspend()
    this.sampleRate = ctx.sampleRate

     // master gain
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.05, ctx.currentTime)
    master.connect(ctx.destination)

    this.master = master
    this.ctx = ctx
    
    // async import custom audio nodes
    console.log('[viardot] Initializing...')
    const audioWorklet = this.ctx.audioWorklet
    Promise.all(['tract', 'noise-modulator', 'aspirator', 'glottis'].map(m => 
      audioWorklet?.addModule(workletPath + m + '.js'))
    ).then(() => this.init(this.ctx)).then(() => this.onComplete(onComplete))
  }

  onComplete(callback?: Function) {
    console.log('[viardot] Intialization complete.')
    if (callback) callback()
  }

  init(ctx: AudioContext) {
    const tract = new TractFilterNode(ctx)
    tract.worklet.connect(this.master)
    // setInterval(() => this.tract.port.postMessage(0), 100)
    
    // Glottal source
    const glottalGain = ctx.createGain()
    const glottalExcitation = new GlottisNode(ctx)
    glottalGain.connect(tract.worklet)
    glottalExcitation.worklet.connect(glottalGain)
    
    // Aspiration
    const aspirationGain = ctx.createGain()
    const aspirator = new AspiratorNode(ctx)
    aspirationGain.connect(glottalGain)
    aspirator.worklet.connect(aspirationGain)

    // Noise
    const noise = new NoiseNode(ctx, 2)
    noise.fricative.connect(tract.worklet, 0, 1)
    noise.aspiration.connect(aspirator.worklet)
    noise.modulator.worklet.connect(aspirationGain.gain)
    // noise.source.connect(this.master)

    // Store
    this.tract = tract
    this.glottalGain = glottalGain
    this.glottalExcitation = glottalExcitation
    this.aspirator = aspirator
    this.aspirationGain = aspirationGain
    this.noise = noise
  }

  // setNasal(value: number) {
  //   this.tract.port.postMessage(value)
  // }

  setFrequency(value: number) {
    const freq = 440 + value * 880
    this.noise.modulator.frequency.value = freq
    this.glottalExcitation.frequency.value = freq
    this.noise.aspiration.frequency.value = freq
  }

  setIntensity(value: number) {
    const tenseness = value * 0.3
    this.glottalExcitation.tenseness.value = value * 0.4
    this.glottalExcitation.loudness.value = Math.pow(value, 0.25)
    this.aspirator.tenseness.value = tenseness
    this.noise.modulator.tenseness.value = tenseness
  }

  setPhoneme(key:string) {
    const values = PhonemeToTonguePosition[key]
    this.setTongue(values[0], values[1])
  }

  setTongue(index: number, diameter: number) {
    this.tract.tongueIndex.value = index
    this.tract.tongueDiameter.value = diameter
  }

  setIndex(index: number) {
    this.tract.tongueIndex.value = index
  }

  setDiameter(diameter: number) {
    this.tract.tongueDiameter.value = diameter
  }
    
  start() {
    this.ctx.resume() 
    this.glottalExcitation.start(this.ctx.currentTime)
    this.noise.modulator.start(this.ctx.currentTime)
    this.aspirator.start(this.ctx.currentTime)
  }
  stop = () => {
    this.glottalExcitation.stop(this.ctx.currentTime)
    this.noise.modulator.stop(this.ctx.currentTime)
    this.aspirator.stop(this.ctx.currentTime)
  }

  recieve = (phones: any) => {console.log(phones)}
}