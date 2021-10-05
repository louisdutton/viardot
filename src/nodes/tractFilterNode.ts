// import Context from '../context'
import { Fach } from '../voice'
import { context as ctx } from "../global"
import WorkletNode from './workletNode'
import { name } from '../worklet/tractFilter.worklet'
import GlottalSourceNode from './glottalSourceNode'

export default class TractFilterNode extends WorkletNode {
  public tongueIndex!: AudioParam 
  public tongueDiameter!: AudioParam
  public tipIndex!: AudioParam
  public tipDiameter!: AudioParam
  public lipDiameter!: AudioParam
  private source: GlottalSourceNode
  private noise: AudioNode
  private filter: BiquadFilterNode

  constructor(Fach: Fach, source: GlottalSourceNode, noise: AudioNode, filter: BiquadFilterNode) {
    super(ctx, name, {
      numberOfInputs: 2, 
      processorOptions: { proportions: TRACT_PROPORTIONS[Fach] }
    });

    this.source = source
    this.noise = noise
    this.filter = filter
  }

  protected onready(node: any): void {
    this.tongueIndex = node.parameters.get('tongueIndex') as AudioParam
    this.tongueDiameter = node.parameters.get('tongueDiameter') as AudioParam
    this.tipIndex = node.parameters.get('tipIndex') as AudioParam
    this.tipDiameter = node.parameters.get('tipDiameter') as AudioParam
    this.lipDiameter = node.parameters.get('lipDiameter') as AudioParam
    // node.port.onmessage = (msg: MessageEvent<any>) => this.diameter = msg.data as Float64Array

    this.source.worklet.connect(this.worklet, 0, 0)
    this.noise.connect(this.worklet, 0, 1)
    this.worklet.connect(this.filter)
  }
}

interface TractProportions {
  oralLength: number
  nasalLength: number
  maxDiameter: number
}

const TRACT_PROPORTIONS: TractProportions[] = [
  { oralLength: 44, nasalLength: 20, maxDiameter: 4 }, // Soprano
  { oralLength: 48, nasalLength: 26, maxDiameter: 4 }, // Mezzo
  { oralLength: 52, nasalLength: 26, maxDiameter: 4 }, // Contralto
  { oralLength: 54, nasalLength: 30, maxDiameter: 4 }, // Tenor
  { oralLength: 58, nasalLength: 30, maxDiameter: 4 }, // Baritone
  { oralLength: 60, nasalLength: 30, maxDiameter: 4 }, // Bass
]