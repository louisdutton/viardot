import { makeNoise2D } from "fast-simplex-noise";

class Aspirator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
    ];
  }
  
  constructor() { 
    super();
    // other code
    var simplex2D = makeNoise2D()
    this.simplex = (t) => simplex2D(t*1.2, -t*0.7) 
  }

  process(IN, OUT, PARAMS) {
    const input = IN[0][0];
    const output = OUT[0][0];
    const intensity = PARAMS.intensity;
    const tenseness = PARAMS.tenseness;

    // pre block
    var mod = intensity[0] * (1-Math.sqrt(tenseness[0]));

    // block
    for (let n = 0; n < 128; n++) {
      output[n] = (input[n] * mod) * (0.2 + 0.01 * this.simplex(currentTime))
    }

    return true;
  }
}

registerProcessor('aspirator', Aspirator);