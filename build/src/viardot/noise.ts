import { 
  AudioContext, 
  AudioBufferSourceNode, 
  BiquadFilterNode, 
  TBiquadFilterType, 
} from 'standardized-audio-context'
import { NoiseModulatorNode } from './nodes'

export default class NoiseNode {
  public readonly aspiration!: BiquadFilterNode<AudioContext>
  public readonly fricative!: BiquadFilterNode<AudioContext>
  public readonly source!: AudioBufferSourceNode<AudioContext>
  public readonly modulator!: NoiseModulatorNode

  constructor(ctx: AudioContext, duration: number) {
    // source
    const source = ctx.createBufferSource()
    source.buffer = this.whiteNoiseBuffer(duration, ctx)
    source.loop = true
    source.start(0)

    // modulator
    const modulator = new NoiseModulatorNode(ctx)
    
    // filters
    const aspirationFilter = this.createFilter(ctx, 800, 0.6, 'bandpass')
    const fricativeFilter = this.createFilter(ctx, 1000, 0.7)

    // connect source to filters
    source.connect(aspirationFilter)
    source.connect(fricativeFilter)
      
    // store
    this.aspiration = aspirationFilter
    this.source = source
    this.modulator = modulator
    this.fricative = fricativeFilter
  }

  createFilter(ctx: AudioContext, frequency: number, q=0.67, type: TBiquadFilterType='bandpass') {
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = q
    return filter
  }

  whiteNoiseBuffer(duration: number, ctx: AudioContext) {
    const bufferSize = duration * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let n = 0; n < channel.length; n++) {
      channel[n] = Math.random() * 2 - 1
    }
    return buffer
  }
}