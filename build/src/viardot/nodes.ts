import { AudioWorkletNode, AudioContext, IAudioParam, IAudioContext, IAudioNode } from "standardized-audio-context"

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
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t: number): void {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

export class NoiseModulatorNode extends CustomNode {
  public readonly frequency: IAudioParam

  constructor(ctx: AudioContext) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })
    this.frequency = this.worklet.parameters.get('frequency') as IAudioParam
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

export class AspiratorNode extends CustomNode {
  constructor(ctx: AudioContext) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
  }
}

export class TractFilterNode {
  public tongueIndex: IAudioParam 
  public tongueDiameter: IAudioParam
  public tipIndex: IAudioParam
  public tipDiameter: IAudioParam

  public worklet!: AudioWorkletNode<AudioContext> 

  constructor(ctx: AudioContext) {
    this.worklet = new AudioWorkletNode<AudioContext>(ctx, 'tract', { numberOfInputs: 2 })
    this.tongueIndex = this.worklet.parameters.get('tongueIndex') as IAudioParam
    this.tongueDiameter = this.worklet.parameters.get('tongueDiameter') as IAudioParam
    this.tipIndex = this.worklet.parameters.get('tipIndex') as IAudioParam
    this.tipDiameter = this.worklet.parameters.get('tipDiameter') as IAudioParam
  }
}