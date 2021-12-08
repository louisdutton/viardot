import { context as ctx } from "./global";
import Context from "./context";
// import NoiseNode from "./nodes/noiseNode"
import VoiceNode from "./voiceNode";
import { Phonemes } from "./dictionaries";
import { clamp, invLerp } from "./utils";
import Ease from "./ease";
import { context } from ".";

/**
 * Monophonic vocal synth.
 * @param {Fach} fach Voice type
 */
export class Voice {
  private readonly node: VoiceNode;
  public readonly fach: Fach;
  public readonly range: VocalRange;
  // public readonly analyser: AnalyserNode
  // public readonly bufferLength: number
  // public dataArray: Uint8Array
  public enabled = true;

  constructor(fach: Fach) {
    this.node = new VoiceNode();
    this.fach = fach;
    this.range = RANGE[fach];

    // Analysis
    // const analyser = ctx.createAnalyser()
    // analyser.fftSize = 1024
    // analyser.maxDecibels = 5
    // this.analyser = analyser
    // this.bufferLength = analyser.frequencyBinCount
    // this.dataArray = new Uint8Array(this.bufferLength)
    // analyser.getByteTimeDomainData(this.dataArray)
  }

  setFrequency(value: number) {
    this.node.setFrequency(value);

    // tenseness
    const interpolant = clamp(1 - invLerp(this.range.bottom, this.range.top, value), 0, 1);

    // female or male vocal mechanism
    const t =
      this.fach < 3 ? (interpolant > 0.8 ? 0.8 + Ease.outExpo(interpolant) * 0.2 : interpolant) : 1 - interpolant;
    this.node.setTenseness(t);
  }

  setLoudness(value: number) {
    const v = clamp(value, 0, 1) * (1 / this.fach);
    this.node.setLoudness(v);
  }

  setPhoneme(phoneme: number[]) {
    this.node.tongueIndex.value = phoneme[0];
    this.node.tongueDiameter.value = phoneme[1];
    this.node.lipDiameter.value = phoneme[2];
  }

  setTongueIndex(index: number) {
    this.node.tongueIndex.value = index;
  }

  setTongueDiameter(diameter: number) {
    this.node.tongueDiameter.value = diameter;
  }

  setLipDiameter(diameter: number) {
    this.node.lipDiameter.value = diameter;
  }

  start = () => this.node.start();
  stop = () => this.node.stop();

  recieve = (phones: any) => {
    console.log(phones);
  };
}

interface VocalRange {
  bottom: number;
  top: number;
  passagio?: {
    primo: number;
    secondo: number;
  };
}

const RANGE: VocalRange[] = [
  { bottom: 261.63, top: 1046.5 } as VocalRange,
  { bottom: 196.0, top: 880.0 } as VocalRange,
  { bottom: 174.61, top: 698.46 } as VocalRange,
  { bottom: 130.81, top: 525.25 } as VocalRange,
  { bottom: 98.0, top: 392.0 } as VocalRange,
  { bottom: 41.2, top: 329.63 } as VocalRange,
];

/** Voice type. */
export enum Fach {
  Soprano,
  Mezzo,
  Contralto,
  Tenor,
  Baritone,
  Bass,
}
