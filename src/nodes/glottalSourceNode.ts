import Context from "../context"
import { context as ctx } from "../global"
import { name } from '../worklet/glottalSource.worklet'
import WorkletNode from "./workletNode"

export default class GlottalSourceNode extends WorkletNode {
  // Audio Parameters
  public tenseness!: AudioParam
  public intensity!: AudioParam
  public frequency!: AudioParam
  public loudness!: AudioParam
  public vibratoRate!: AudioParam
  public vibratoDepth!: AudioParam
  public aspiration: AudioNode

  constructor(aspiration: AudioNode) {
    super(ctx, name, {
      channelCount: 1,
      numberOfInputs: 1,
      numberOfOutputs: 1
    });

    this.aspiration = aspiration
  }

  onready = (worklet: any) => {
    this.tenseness = worklet.parameters.get('tenseness') as AudioParam
    this.intensity = worklet.parameters.get('intensity') as AudioParam
    this.frequency = worklet.parameters.get('frequency') as AudioParam
    this.loudness = worklet.parameters.get('loudness') as AudioParam
    this.vibratoRate = worklet.parameters.get('vibratoRate') as AudioParam
    this.vibratoDepth = worklet.parameters.get('vibratoDepth') as AudioParam

    this.vibratoRate.value = 5.5 + Math.random() * .5
    this.vibratoDepth.value = 6 // pitch extent (amplitude)

    this.aspiration.connect(this.worklet)
  }

  setIntensity(value: number) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(value, ctx.now() + .25)
  }

  start = (): void => this.setIntensity(1)
  stop = (): void => this.setIntensity(.0001)
}