import NoiseNode from './noise'
import { Fach } from './enums'
import { PhonemeToTonguePosition } from './dictionaries'
import { AudioContext, GainNode } from 'standardized-audio-context'
import { TractFilterNode, GlottisNode, AspiratorNode } from './nodes'
import Freeverb from 'freeverb'

let $audioContext: AudioContext;
let $master: GainNode<AudioContext>
let $reverb: any

const workletModules = ['tract', 'noise-modulator', 'aspirator', 'glottis']
export const Start = async (): Promise<void[]> => {
  const ctx = $audioContext = new AudioContext()

  // global master gain
  $master = ctx.createGain()
  $master.gain.setValueAtTime(0.05, ctx.currentTime)
  $master.connect(ctx.destination)

  // global reverb
  $reverb = Freeverb(ctx)
  $reverb.roomSize = 0.7
  $reverb.dampening = 3000
  $reverb.wet.value = .2
  $reverb.dry.value = 1
  $reverb.connect($master)

  const workletPath = 'worklets/'
  console.log('[viardot] Initializing...')
  const audioWorklet = ctx.audioWorklet
  return Promise.all(workletModules.map(m => 
    audioWorklet?.addModule(workletPath + m + '.js'))
  )
}

/**
 * Monophonic vocal synthesizer.
 * @example 
 * const voice = new Voice(FACH.SOPRANO)
 * voice.start('C4')
 */
export class Voice {   
  private readonly ctx: AudioContext
  private tract: TractFilterNode
  private glottalSource: GainNode<AudioContext>
  private glottalExcitation: GlottisNode
  private aspiration: GainNode<AudioContext>
  private noise: NoiseNode
  public readonly fach: Fach
  public readonly range: IVocalRange
  public portamento: number
  
  /**
   * 
   * @param  {Fach}     fach        Voice type
   * @param  {Function} onComplete  Completion callback
   */
  constructor(fach: Fach) {
    if (!$audioContext) return null
    const ctx = $audioContext

    this.fach = fach
    this.range = getVocalRange(fach)

    const tract = new TractFilterNode(ctx, this.fach)
    tract.worklet.connect($reverb)
    // setInterval(() => this.tract.port.postMessage(0), 100)
    
    // Glottal source
    const glottalSource = ctx.createGain()
    const glottalExcitation = new GlottisNode(ctx)
    glottalSource.connect(tract.worklet, 0, 0)
    // glottalSource.connect($master)
    glottalExcitation.vibratoRate.value = 5.5 + Math.random() * .5
    glottalExcitation.vibratoDepth.value = 6 // pitch extent
    glottalExcitation.worklet.connect(glottalSource)

    // Noise
    const noise = new NoiseNode(ctx, 2)
    noise.fricative.connect(tract.worklet, 0, 1)
    noise.aspiration.connect(glottalSource)

    // Store
    this.ctx = ctx
    this.tract = tract
    this.glottalSource = glottalSource
    this.glottalExcitation = glottalExcitation
    this.noise = noise
    this.portamento = 0.1

    this.setIntensity(1)
    this.stop()
    // this.setFrequency(0)
  }

  // setNasal(value: number) {
  //   this.tract.port.postMessage(value)
  // }

  setFrequency(value: number) {
    // const freq = this.range.bottom + value * (this.range.top - this.range.bottom)
    const freq = value
    this.glottalExcitation.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + this.portamento)
    this.noise.modulator.frequency.value = freq
    // this.setIntensity(1-(freq / (this.range.top - this.range.bottom)))
  }

  setIntensity(value: number) {
    const tenseness = value * 0.7
    this.glottalExcitation.tenseness.value = tenseness
    this.glottalExcitation.loudness.value = Math.pow(value, 0.25)
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
  }
  stop() {
    this.glottalExcitation.stop(this.ctx.currentTime)
    this.noise.modulator.stop(this.ctx.currentTime)
  }

  recieve = (phones: any) => {console.log(phones)}
}

interface IVocalRange { 
  bottom: number, 
  top: number, 
  passagio?: { 
    primo: number,
    secondo: number
  } 
}

function getVocalRange(fach: Fach) {
  switch (fach) {
    case Fach.Soprano:    return { bottom: 261.63, top: 1046.50 } as IVocalRange
    case Fach.Mezzo:      return { bottom: 196.00, top: 880.00  } as IVocalRange
    case Fach.Contralto:  return { bottom: 174.61, top: 698.46  } as IVocalRange
    case Fach.Tenor:      return { bottom: 130.81, top: 525.25  } as IVocalRange
    case Fach.Baritone:   return { bottom: 98.00,  top: 392.00  } as IVocalRange
    case Fach.Bass:       return { bottom: 41.20,  top: 329.63  } as IVocalRange
  }
}