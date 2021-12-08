// import Context from "../context"
import { context as ctx } from "./global";
import { name } from "./voice.worklet";
import WorkletNode from "./workletNode";
import { Random, humanize, clamp } from "./utils";

interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export default class VoiceNode extends WorkletNode {
  //glottis
  public tenseness!: AudioParam;
  public intensity!: AudioParam;
  public frequency!: AudioParam;
  public loudness!: AudioParam;
  public vibratoRate!: AudioParam;
  public vibratoDepth!: AudioParam;
  // tract
  public tongueIndex!: AudioParam;
  public tongueDiameter!: AudioParam;
  public tipIndex!: AudioParam;
  public tipDiameter!: AudioParam;
  public lipDiameter!: AudioParam;
  // other
  public adsr: ADSR;
  public portamento: number;

  constructor() {
    super(ctx, name, {
      channelCount: 1,
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });

    this.portamento = Random.range(0.2, 0.3);
    this.adsr = {
      attack: 0.5,
      decay: 0.1,
      sustain: 1,
      release: 0.25,
    };
  }

  onready = (worklet: any) => {
    this.tenseness = worklet.parameters.get("tenseness") as AudioParam;
    this.intensity = worklet.parameters.get("intensity") as AudioParam;
    this.frequency = worklet.parameters.get("frequency") as AudioParam;
    this.loudness = worklet.parameters.get("loudness") as AudioParam;
    this.vibratoRate = worklet.parameters.get("vibratoRate") as AudioParam;
    this.vibratoDepth = worklet.parameters.get("vibratoDepth") as AudioParam;

    this.vibratoRate.value = Random.range(4.5, 5.5);
    this.vibratoDepth.value = Random.range(5.75, 6.25); // pitch extent (amplitude)
    this.tenseness.value = 1;
  };

  setFrequency(value: number) {
    this.frequency.cancelScheduledValues(0);
    this.frequency.exponentialRampToValueAtTime(value, ctx.now() + this.portamento);
  }

  setIntensity(value: number, time: number) {
    this.intensity.cancelScheduledValues(0);
    this.intensity.exponentialRampToValueAtTime(value, ctx.now() + time);
  }

  setTenseness(value: number) {
    const v = clamp(value, 0, 1);
    this.tenseness.value = v;
  }

  setLoudness(value: number) {
    this.loudness.value = value;
  }

  start = (): void => this.setIntensity(1, humanize(this.adsr.attack, 0.1));
  stop = (): void => this.setIntensity(0.0001, humanize(this.adsr.release, 0.5));
}
