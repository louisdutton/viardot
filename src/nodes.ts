import { AudioWorkletNode, AudioContext, IAudioParam } from "standardized-audio-context"
import { Fach } from './enums'

export class GlottisNode {
  public worklet!: AudioWorkletNode<AudioContext> 

  public readonly tenseness: IAudioParam
  public readonly intensity: IAudioParam
  public readonly frequency: IAudioParam
  public readonly loudness: IAudioParam
  public readonly vibratoRate: IAudioParam
  public readonly vibratoDepth: IAudioParam
  // private active: boolean

  constructor(ctx: AudioContext) {
    this.worklet = new AudioWorkletNode<AudioContext>(ctx, 'glottis', {
      channelCount: 1,
      numberOfInputs: 1,
      numberOfOutputs: 1
    })

    this.tenseness = this.worklet.parameters.get('tenseness') as IAudioParam
    this.intensity = this.worklet.parameters.get('intensity') as IAudioParam
    this.frequency = this.worklet.parameters.get('frequency') as IAudioParam
    this.loudness = this.worklet.parameters.get('loudness') as IAudioParam
    this.vibratoRate = this.worklet.parameters.get('vibratoRate') as IAudioParam
    this.vibratoDepth = this.worklet.parameters.get('vibratoDepth') as IAudioParam
    // this.active = false
  }

  start(t: number): void {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + .25)
  }

  stop(t: number): void {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + .25)
  }
}

interface TractProportions {
  oralLength: number
  nasalLength: number
  maxDiameter: number
}

export class TractFilterNode {
  public tongueIndex: IAudioParam 
  public tongueDiameter: IAudioParam
  public tipIndex: IAudioParam
  public tipDiameter: IAudioParam
  public lipDiameter: IAudioParam
  public diameter: Float64Array
  public worklet!: AudioWorkletNode<AudioContext> 

  constructor(ctx: AudioContext, Fach: Fach) {
    const proportions = this.calculateProportions(Fach)
    this.worklet = new AudioWorkletNode<AudioContext>(ctx, 'tract', { 
      numberOfInputs: 2, 
      processorOptions: { proportions: proportions }
    })

    this.tongueIndex = this.worklet.parameters.get('tongueIndex') as IAudioParam
    this.tongueDiameter = this.worklet.parameters.get('tongueDiameter') as IAudioParam
    this.tipIndex = this.worklet.parameters.get('tipIndex') as IAudioParam
    this.tipDiameter = this.worklet.parameters.get('tipDiameter') as IAudioParam
    this.lipDiameter = this.worklet.parameters.get('lipDiameter') as IAudioParam
    this.diameter = new Float64Array(proportions.oralLength)
    this.worklet.port.onmessage = (msg: MessageEvent<any>) => this.diameter = msg.data as Float64Array
  }

  calculateProportions(Fach: Fach): TractProportions {
    return TRACT_PROPORTIONS[Fach]
  }
}

const TRACT_PROPORTIONS = [
  { // Soprano
    oralLength: 40,
    nasalLength: 28,
    maxDiameter: 4,
  },
  { // Mezzo
    oralLength: 42,
    nasalLength: 28,
    maxDiameter: 4,
  },
  { // Contralto
    oralLength: 44,
    nasalLength: 28,
    maxDiameter: 4,
  },
  { // Tenor
    oralLength: 50,
    nasalLength: 28,
    maxDiameter: 3.5,
  },
  { // Baritone
    oralLength: 56,
    nasalLength: 28,
    maxDiameter: 4,
  },
  { // Bass
    oralLength: 58,
    nasalLength: 40,
    maxDiameter: 3.5,
  }
]