import { context as ctx } from './global'
import Context from './context'
import NoiseNode from './nodes/noiseNode'
import GlottalSourceNode from './nodes/glottalSourceNode'
import TractFilterNode from './nodes/tractFilterNode'
import { PhonemeToTonguePosition } from './dictionaries'

/** Monophonic vocal synthesizer.
* @param {Fach} fach Voice type
*/
export class Voice {
  private readonly tract: TractFilterNode
  private readonly glottis: GlottalSourceNode
  public readonly fach: Fach
  public readonly range: VocalRange
  public portamento: number
  
  constructor(fach: Fach) {
    // Noise Source (split used for both aspiration and fricative noise)
    const noise = new NoiseNode(2)

    // Create worklet nodes
    const glottalSource = new GlottalSourceNode(noise.aspiration)
    const tractFilter = new TractFilterNode(fach, glottalSource, noise.fricative)

    this.tract = tractFilter
    this.glottis = glottalSource
    this.portamento = .1 + Math.random() * .15
    this.fach = fach
    this.range = RANGE[fach]
  }

  // getTractData = (): Float64Array => this.tract.diameter

  setFrequency(value: number) {
    this.glottis.frequency.exponentialRampToValueAtTime(value, ctx.now() + this.portamento)
  }

  setIntensity(value: number) {
    const v = Math.max(value * 0.7, 0)
    this.glottis.tenseness.value = v
    this.glottis.loudness.value = Math.pow(v, 0.5)
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