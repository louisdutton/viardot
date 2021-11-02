import * as Global from "../global"
import Context from "../context"
import { Random } from "../utils"

export default class NoiseNode {
  public readonly aspiration: BiquadFilterNode
  public readonly fricative: BiquadFilterNode
  public readonly source: AudioBufferSourceNode

  constructor(duration: number) {
    const ctx = Global.context

    // source
    const source = ctx.createBufferSource()
    source.buffer = this.gaussianBuffer(ctx, duration)
    source.loop = true
    source.start(0)

    // filters
    const aspiration = ctx.createBiquadFilter(500, 1, "lowpass")
    const fricative = ctx.createBiquadFilter(1000, 1)

    // connect source to filters
    source.connect(aspiration)
    source.connect(fricative)

    // store
    this.source = source
    this.aspiration = aspiration
    this.fricative = fricative
  }

  gaussianBuffer(ctx: Context, duration: number) {
    const bufferSize = duration * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize)
    const channel = buffer.getChannelData(0)
    for (let n = 0; n < channel.length; n++) channel[n] = Random.gaussian() * 0.08
    return buffer
  }
}
