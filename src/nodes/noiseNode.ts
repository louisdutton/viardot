import * as Global from '../global'
import Context from '../context'

// normal-distrubted noise (mean: 0, sd: 1)
function gaussian() {
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

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
    const aspiration = ctx.createBiquadFilter(1000, .7, 'lowpass')
    const fricative = ctx.createBiquadFilter(1000, 0.1)

    // connect source to filters
    source.connect(aspiration)
    source.connect(fricative)
      
    // store
    this.source = source
    this.aspiration = aspiration
    this.fricative = fricative
  }

  gaussianBuffer(ctx: Context, duration: number) {
    const bufferSize = duration * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize)
    const channel = buffer.getChannelData(0)
    for (let n = 0; n < channel.length; n++) 
      channel[n] = gaussian() * 0.05
    return buffer
  }
}