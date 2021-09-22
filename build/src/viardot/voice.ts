import NoiseNode from './noise'
import { Fach } from './enums'
import { PhonemeToTonguePosition } from './dictionaries'
import { AudioContext, GainNode } from 'standardized-audio-context'
import { TractFilterNode, GlottisNode } from './nodes'
import Freeverb from 'freeverb'

let $audioContext: AudioContext;
let $master: GainNode<AudioContext>
let $reverb: any

const workletModules = ['tract', 'glottis']
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
  $reverb.dry.value = .8
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
  private glottis: GlottisNode
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
    const glottis = new GlottisNode(ctx)
    glottis.vibratoRate.value = 5.5 + Math.random() * .5
    glottis.vibratoDepth.value = 6 // pitch extent (amplitude)
    glottis.worklet.connect(tract.worklet, 0, 0)

    // Noise
    const noise = new NoiseNode(ctx, 2)
    noise.fricative.connect(tract.worklet, 0, 1)
    noise.aspiration.connect(glottis.worklet)

    // Store
    this.ctx = ctx
    this.tract = tract
    this.glottis = glottis
    this.noise = noise
    this.portamento = 0.1

    this.setIntensity(1)
    this.stop()
    // this.setFrequency(0)
  }

  getTractData = (): Float64Array => {
    // this.tract.worklet.port.postMessage(null)
    return this.tract.diameter
  }

  setFrequency(value: number) {
    // const freq = this.range.bottom + value * (this.range.top - this.range.bottom)
    const freq = value
    this.glottis.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + this.portamento)
    // this.setIntensity(1-(freq / (this.range.top - this.range.bottom)))
  }

  setIntensity(value: number) {
    const tenseness = value * 0.7
    this.glottis.tenseness.value = tenseness
    this.glottis.loudness.value = Math.pow(value, 0.25)
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

  setLipTarget(diameter: number) {
    this.tract.lipDiameter.value = diameter
  }
    
  start() {
    this.ctx.resume() 
    this.glottis.start(this.ctx.currentTime)
  }
  stop() {
    this.glottis.stop(this.ctx.currentTime)
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