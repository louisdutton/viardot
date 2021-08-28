import { AudioWorkletNode, AudioContext, IAudioParam } from "standardized-audio-context"

abstract class CustomNode extends AudioWorkletNode!<AudioContext>{
  public readonly tenseness: IAudioParam
  public readonly intensity: IAudioParam

  constructor(ctx: AudioContext, name: string, options: AudioWorkletNodeOptions) {
    super(ctx, name, options)
    this.tenseness = this.parameters.get('tenseness') as IAudioParam
    this.intensity = this.parameters.get('intensity') as IAudioParam
  }
  
  start(t: number): void {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t: number) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

export class NoiseModulatorNode extends CustomNode {
  public readonly frequency: IAudioParam

  constructor(ctx: AudioContext) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })
    this.frequency = this.parameters.get('frequency') as IAudioParam
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
    this.frequency = this.parameters.get('frequency') as IAudioParam
    this.loudness = this.parameters.get('loudness') as IAudioParam
    this.vibratoRate = this.parameters.get('vibratoRate') as IAudioParam
    this.vibratoDepth = this.parameters.get('vibratoDepth') as IAudioParam
    this.active = false
  }
}

export class AspiratorNode extends CustomNode {
  tenseness: IAudioParam
  intensity: IAudioParam

  constructor(ctx: AudioContext) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
    this.tenseness = this.parameters.get('tenseness') as IAudioParam
    this.intensity = this.parameters.get('intensity') as IAudioParam
  }
}

export class TractFilterNode extends AudioWorkletNode!<AudioContext> {
  tongueIndex: IAudioParam 
  tongueDiameter: IAudioParam
  tipIndex: IAudioParam
  tipDiameter: IAudioParam

  constructor(ctx: AudioContext) {
    super(ctx, 'tract', { numberOfInputs: 2 })
    this.tongueIndex = this.parameters.get('tongueIndex') as IAudioParam
    this.tongueDiameter = this.parameters.get('tongueDiameter') as IAudioParam
    this.tipIndex = this.parameters.get('tipIndex') as IAudioParam
    this.tipDiameter = this.parameters.get('tipDiameter') as IAudioParam
  }
}