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
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const simplex = inputs[1];
    const intensity = parameters.intensity;
    const tenseness = parameters.tenseness;
    const mod = intensity[0] * (1-Math.sqrt(tenseness[0]));

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      const simplexChannel = simplex[channel];
      for (let n = 0; n < inputChannel.length; n++) {
        var aspiration = inputChannel[n] * mod;
        // aspiration *= 0.2 + 0.02 * simplexChannel[n];
        outputChannel[n] = aspiration;
      }
    }

    return true;
  }
}

registerProcessor('aspirator', Aspirator);