import { 
  AudioContext, 
  AudioBufferSourceNode, 
  BiquadFilterNode, 
  GainNode,
  OscillatorNode,
  TBiquadFilterType, 
} from 'standardized-audio-context'
import { NoiseModulatorNode } from './nodes'

// normal-distrubted noise (mean: 0, sd: 1)
function gaussian() {
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

export default class NoiseNode {
  public readonly aspiration!: GainNode<AudioContext>
  public readonly fricative!: BiquadFilterNode<AudioContext>
  public readonly source!: AudioBufferSourceNode<AudioContext>
  public readonly modulator!: NoiseModulatorNode

  constructor(ctx: AudioContext, duration: number) {
    // source
    const source = ctx.createBufferSource()
    source.buffer = this.gaussianBuffer(duration, ctx)
    source.loop = true
    source.start(0)

    // modulator
    const modulator = new NoiseModulatorNode(ctx)
    
    // filters
    const aspirationFilter = this.createFilter(ctx, 1000, .5, 'bandpass')
    const fricativeFilter = this.createFilter(ctx, 1000, 0.5)

    // connect source to filters
    source.connect(aspirationFilter)
    source.connect(fricativeFilter)

    const gain = new GainNode(ctx)
    aspirationFilter.connect(modulator.worklet)
    modulator.worklet.connect(gain)
      
    // store
    this.aspiration = gain
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

  gaussianBuffer(duration: number, ctx: AudioContext) {
    const bufferSize = duration * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let n = 0; n < channel.length; n++) 
      channel[n] = gaussian() * 0.05
    return buffer
  }
}