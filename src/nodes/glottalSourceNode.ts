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
  public adsr: ADSR
  public portamento: number

  constructor(aspiration: AudioNode) {
    super(ctx, name, {
      channelCount: 1,
      numberOfInputs: 1,
      numberOfOutputs: 1
    });

    this.aspiration = aspiration
    this.portamento = .25 + Math.random() * .5
    this.adsr = {
      attack: .5,
      decay: .1,
      sustain: 1,
      release: .25,
    }
  }

  onready = (worklet: any) => {
    this.tenseness = worklet.parameters.get('tenseness') as AudioParam
    this.intensity = worklet.parameters.get('intensity') as AudioParam
    this.frequency = worklet.parameters.get('frequency') as AudioParam
    this.loudness = worklet.parameters.get('loudness') as AudioParam
    this.vibratoRate = worklet.parameters.get('vibratoRate') as AudioParam
    this.vibratoDepth = worklet.parameters.get('vibratoDepth') as AudioParam

    this.vibratoRate.value = 4 + Math.random() * 2
    this.vibratoDepth.value = 4 + Math.random() * 3// pitch extent (amplitude)

    this.aspiration.connect(this.worklet)
  }

  setFrequency(value: number) {
    this.frequency.cancelScheduledValues(0)
    this.frequency.exponentialRampToValueAtTime(value, ctx.now() + this.portamento)
  }

  setIntensity(value: number, time: number) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(value, ctx.now() + time)
  }

  setTenseness(value: number) {
    const v = Math.max(value * .5, 0)
    this.tenseness.value = v
    this.loudness.value = Math.pow(v, .7)
  }

  start = (): void => this.setIntensity(1, this.humanize(this.adsr.attack, .1))
  stop = (): void => this.setIntensity(.0001, this.humanize(this.adsr.release, .5))

  humanize = (value: number, ratio: number): number => value + (Math.random()-1) * 2 * value*ratio
}

interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}