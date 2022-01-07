import { Random, ADSR } from "./utils";
import { Phoneme } from "./phonemes";

const RANGE = {
  soprano: [261.63, 1046.5] as Range,
  mezzo: [196.0, 880.0] as Range,
  contralto: [174.61, 698.46] as Range,
  tenor: [130.81, 525.25] as Range,
  baritone: [98.0, 392.0] as Range,
  bass: [41.2, 329.63] as Range,
};

type Fach = "soprano" | "mezzo" | "contralto" | "tenor" | "baritone" | "bass";
type Range = [number, number];
type Options = {
  oralLength: number;
  nasalLength: number;
  maxDiameter: number;
};

export class Voice {
  // glottal control
  public readonly ctx: AudioContext;
  public tenseness!: AudioParam;
  public intensity!: AudioParam;
  public frequency!: AudioParam;
  public loudness!: AudioParam;
  public vibratoRate!: AudioParam;
  public vibratoDepth!: AudioParam;
  // tongue control
  public bladePosition!: AudioParam;
  public bladeDiameter!: AudioParam;
  public tipPosition!: AudioParam;
  public tipDiameter!: AudioParam;
  // lip control
  public lipDiameter!: AudioParam;
  // other
  public adsr: ADSR;
  public portamento: number;
  public readonly fach: Fach;
  public readonly range: Range;
  private worklet!: AudioWorkletNode;

  constructor(ctx: AudioContext, fach: Fach) {
    this.init(ctx);

    this.ctx = ctx;
    this.portamento = Random.range(0.2, 0.3);
    this.adsr = new ADSR(0.5, 0.1, 1, 0.25);
    this.fach = fach;
    this.range = RANGE[fach];
  }

  init = async (ctx: AudioContext) => {
    await ctx.audioWorklet.addModule("worklet/voice.js");
    const worklet = new AudioWorkletNode(ctx, "voice-processor", {
      channelCount: 1,
      numberOfInputs: 1,
      numberOfOutputs: 1,
      processorOptions: { oralLength: 44, nasalLength: 22, maxDiameter: 4 } as Options,
    });
    console.log(worklet);

    loadWasmModule("/pkg/belcanto_bg.wasm").then((wasm) => {
      this.worklet.port.postMessage({ type: "load-wasm", wasm });
    });

    this.tenseness = worklet.parameters.get("tenseness") as AudioParam;
    this.intensity = worklet.parameters.get("intensity") as AudioParam;
    this.frequency = worklet.parameters.get("frequency") as AudioParam;
    this.loudness = worklet.parameters.get("loudness") as AudioParam;
    this.vibratoRate = worklet.parameters.get("vibratoRate") as AudioParam;
    this.vibratoDepth = worklet.parameters.get("vibratoDepth") as AudioParam;
    this.bladePosition = worklet.parameters.get("bladePosition") as AudioParam;
    this.bladeDiameter = worklet.parameters.get("bladeDiameter") as AudioParam;
    this.tipPosition = worklet.parameters.get("tipPosition") as AudioParam;
    this.tipDiameter = worklet.parameters.get("tipDiameter") as AudioParam;
    this.lipDiameter = worklet.parameters.get("lipDiameter") as AudioParam;

    // initialize values
    this.tenseness.value = 0;
    this.intensity.value = 0.5;
    this.loudness.value = 0.5;
    this.frequency.value = 220; // A3
    this.vibratoRate.value = Random.range(4.5, 5.5);
    this.vibratoDepth.value = Random.range(5.75, 6.25); // pitch extent (amplitude)
    // Tongue
    this.bladePosition.value = 0.2;
    this.bladeDiameter.value = 0.5;
    this.tipPosition.value = 0.0;
    this.tipDiameter.value = 0.0;
    // Lip
    this.lipDiameter.value = 0.0;

    // store worklet
    this.worklet = worklet;
    this.worklet.connect(this.ctx.destination);
  };

  // toDestination() {
  //   this.worklet.connect(this.ctx.destination);
  // }

  setPhoneme(phoneme: Phoneme) {
    this.bladePosition.value = phoneme[0];
    this.bladeDiameter.value = phoneme[1];
    this.lipDiameter.value = phoneme[2];
  }

  start = () => {
    if (this.ctx.state !== "running") this.ctx.resume();
    this.intensity.value = 1;
  };
  stop = () => (this.intensity.value = 0);
}

/**
 * loads a WASM module
 * @param url The url of the module
 * @param name The name of the module
 */
async function loadWasmModule(url: string) {
  const response = await window.fetch(url);
  const wasmBytes = await response.arrayBuffer();
  return wasmBytes;
}
