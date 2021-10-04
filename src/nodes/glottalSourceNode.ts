import Context from "../context"
import { context as ctx } from "../global"
import { name } from '../worklet/glottalSource.worklet'
import WorkletNode from "./workletNode"
import { Random, clamp } from "../utils"

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
    this.portamento = Random.range(.1, .2)
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

    this.vibratoRate.value = Random.range(4.5, 5.5)
    this.vibratoDepth.value = Random.range(5, 7) // pitch extent (amplitude)

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
    const v = clamp(value * .75, 0, 1)
    this.tenseness.value = v
    this.loudness.value = Math.pow(v, .2)
  }

  start = (): void => this.setIntensity(1, this.humanize(this.adsr.attack, .1))
  stop = (): void => this.setIntensity(.0001, this.humanize(this.adsr.release, .5))

  humanize = (value: number, ratio: number): number => value + (Random.value()-1) * 2 * value*ratio
}

interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}