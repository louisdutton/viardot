import { AudioWorkletNode, AudioContext, IAudioParam } from "standardized-audio-context"
import { Fach } from './enums'

abstract class CustomNode {
  public readonly tenseness: IAudioParam
  public readonly intensity: IAudioParam

  public worklet!: AudioWorkletNode<AudioContext> 

  constructor(ctx: AudioContext, name: string, options: AudioWorkletNodeOptions) {
    this.worklet = new AudioWorkletNode<AudioContext>(ctx, name, options)
    this.tenseness = this.worklet.parameters.get('tenseness') as IAudioParam
    this.intensity = this.worklet.parameters.get('intensity') as IAudioParam
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

export class NoiseModulatorNode extends CustomNode {
  public readonly frequency: IAudioParam

  constructor(ctx: AudioContext) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })
    this.frequency = this.worklet.parameters.get('frequency') as IAudioParam
  }
}

export class AspiratorNode extends CustomNode {
  constructor(ctx: AudioContext) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
  }
}

export class GlottisNode extends CustomNode {
  public readonly frequency: IAudioParam
  public readonly loudness: IAudioParam
  public readonly vibratoRate: IAudioParam
  public readonly vibratoDepth: IAudioParam
  private active: boolean

  constructor(ctx: AudioContext) {
    super(ctx, 'glottis', { channelCount: 1, numberOfInputs: 0, numberOfOutputs: 1 })
    this.frequency = this.worklet.parameters.get('frequency') as IAudioParam
    this.loudness = this.worklet.parameters.get('loudness') as IAudioParam
    this.vibratoRate = this.worklet.parameters.get('vibratoRate') as IAudioParam
    this.vibratoDepth = this.worklet.parameters.get('vibratoDepth') as IAudioParam
    this.active = false
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
    oralLength: 58,
    nasalLength: 28,
    maxDiameter: 4,
  },
  { // Bass
    oralLength: 58,
    nasalLength: 40,
    maxDiameter: 3.5,
  }
]