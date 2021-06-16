class NoiseModulator extends AudioWorkletProcessor {
    
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate' }
    ];
  }
  
  constructor() { 
    super();
    // other code
    this.floor = 0.1;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const intensity = parameters.intensity;
    const tenseness = parameters.tenseness;

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let n = 0; n < 128; n++) {

        var voiced = this.floor + 0.2 * Math.max(0, inputChannel[n]);
        outputChannel[n] = tenseness[0] * intensity[0] * voiced + (1-tenseness[0] * intensity[0] ) * 0.3;
        outputChannel[n] = voiced;
      }
    }

    return true;
  }
}

registerProcessor('noise-modulator', NoiseModulator);