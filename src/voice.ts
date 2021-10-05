import { context as ctx } from './global'
import Context from './context'
import NoiseNode from './nodes/noiseNode'
import GlottalSourceNode from './nodes/glottalSourceNode'
import TractFilterNode from './nodes/tractFilterNode'
import { Phonemes } from './dictionaries'
import { clamp, invLerp } from './utils'
import Ease from './ease'
import { context } from '.'

/**
* Monophonic vocal synth.
* @param {Fach} fach Voice type
*/
export class Voice {
  private readonly tract: TractFilterNode
  private readonly glottis: GlottalSourceNode
  public readonly fach: Fach
  public readonly range: VocalRange
  public readonly analyser: AnalyserNode
  public readonly bufferLength: number
  public dataArray: Uint8Array
  public enabled = true
  
  constructor(fach: Fach) {
    // Analysis
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.maxDecibels = 5

    const filter = ctx.createBiquadFilter(2500, 12, 'lowpass')
    const formant = ctx.createBiquadFilter(500, 1, 'lowshelf')
    filter.connect(formant)
    // filter.connect(ctx.master)
    // filter.connect(analyser)
    formant.connect(ctx.master)
    formant.connect(analyser)

    // Noise Source (split used for both aspiration and fricative noise)
    const noise = new NoiseNode(5)

    // Create worklet nodes
    const glottalSource = new GlottalSourceNode(noise.aspiration)
    const tractFilter = new TractFilterNode(fach, glottalSource, noise.fricative, filter)

    this.tract = tractFilter
    this.glottis = glottalSource
    this.fach = fach
    this.range = RANGE[fach]
    this.analyser = analyser
    
    this.bufferLength = analyser.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)
    analyser.getByteTimeDomainData(this.dataArray)
  }

  setFrequency(value: number) {
    const tenseness = clamp(1-invLerp(this.range.bottom, this.range.top, value), 0, 1)
    this.glottis.setFrequency(value)
    if (this.fach < 3) this.glottis.setTenseness(1/value)
  }

  setLoudness(value: number) {
    const v = clamp(value, 0, 1) * .6
    this.glottis.setLoudness(v)
  }

  setPhoneme(phoneme: number[]) {
    this.tract.tongueIndex.value = phoneme[0]
    this.tract.tongueDiameter.value = phoneme[1]
    this.tract.lipDiameter.value = phoneme[2]
  }

  setTongueIndex(index: number) {
    this.tract.tongueIndex.value = index
  }

  setTongueDiameter(diameter: number) {
    this.tract.tongueDiameter.value = diameter
  }

  setLipDiameter(diameter: number) {
    this.tract.lipDiameter.value = diameter
  }
    
  start = () => this.glottis.start()
  stop = () => this.glottis.stop()

  recieve = (phones: any) => {console.log(phones)}
}

interface VocalRange { 
  bottom: number, 
  top: number, 
  passagio?: { 
    primo: number,
    secondo: number
  } 
}

const RANGE: VocalRange[] = [
  { bottom: 261.63, top: 1046.50 } as VocalRange,
  { bottom: 196.00, top: 880.00  } as VocalRange,
  { bottom: 174.61, top: 698.46  } as VocalRange,
  { bottom: 130.81, top: 525.25  } as VocalRange,
  { bottom: 98.00,  top: 392.00  } as VocalRange,
  { bottom: 41.20,  top: 329.63  } as VocalRange,
]

/** Voice type. */
export enum Fach {
  Soprano,
  Mezzo,
  Contralto,
  Tenor,
  Baritone,
  Bass,
}