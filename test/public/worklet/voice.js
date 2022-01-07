class VoiceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "bladePosition", defaultValue: 0.2, automationRate: "k-rate" },
      { name: "bladeDiameter", defaultValue: 0.2, automationRate: "k-rate" },
      { name: "tipPosition", defaultValue: 0.7, automationRate: "k-rate" },
      { name: "tipDiameter", defaultValue: 1, automationRate: "k-rate" },
      { name: "lipDiameter", defaultValue: 0.5, automationRate: "k-rate" },
      { name: "tenseness", defaultValue: 0.6, automationRate: "k-rate" },
      { name: "intensity", defaultValue: 0.0, automationRate: "k-rate" },
      { name: "frequency", defaultValue: 440, automationRate: "a-rate" },
      { name: "vibratoDepth", defaultValue: 8.0, automationRate: "k-rate" },
      { name: "vibratoRate", defaultValue: 6.0, automationRate: "k-rate" },
      { name: "loudness", defaultValue: 0.5, automationRate: "k-rate" },
    ];
  }

  constructor({ options }) {
    super();
    this.proportions = options;
    this.port.onmessage = (e) => this.onmessage(e.data);
  }

  onmessage(data) {
    if (data.type === "load-wasm") {
      WebAssembly.instantiate(e.wasm).then((w) => {
        this.wasm = w.instance;
        // grow memory to accomodate full sample ...
        this.wasm.exports.memory.grow(250);
        this.size = 128;

        // why always last ??
        this._outPtr_r = this._wasm.exports.alloc(this.size);
        this._outBuf_r = new Float32Array(this._wasm.exports.memory.buffer, this._outPtr_r, this.size);
        this._outPtr_l = this._wasm.exports.alloc(this.size);
        this._outBuf_l = new Float32Array(this._wasm.exports.memory.buffer, this._outPtr_l, this.size);
      });
    }
  }

  process(inputs, outputs, parameters) {
    if (!this.wasm) return true;

    const output = outputs[0][0];

    this.wasm.exports.process(this.size, currentTime);
    output.set(this._outBuf);
    return true;
  }

  // process(in_, out, params) {
  // const output = out[0][0];

  // if (!this.voice) return;
  // params
  // const bladePosition = params.bladePosition[0];
  // const tongueDiameter = params.bladeDiameter[0];
  // const tipPosition = params.tipPosition[0];
  // const tipDiameter = params.tipDiameter[0];
  // const lipDiameter = params.lipDiameter[0];

  // block start
  // call wasm process
  // const sample = this.voice.process(currentTime);

  // block end
  // updateTongue(tongueIndex, tongueDiameter)
  // updateLip(lipDiameter)
  // this.updateConstrictions(tipIndex, tipDiameter)
  // reshapeTract
  // calculateReflectionCoefficients

  // post tract data
  // this.port.postMessage(this.diameter)

  //   return true;
  // }
}
