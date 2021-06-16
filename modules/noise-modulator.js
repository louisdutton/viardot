class NoiseModulator extends AudioWorkletProcessor {
    
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate' },
      { name: 'floor', defaultValue: 0.1, automationRate: 'k-rate' }
    ];
  }
  
  constructor() { 
    super();
    // other code
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = output[0];
    const intensity = parameters.intensity;
    const tenseness = parameters.tenseness;
    const floor = parameters.floor;

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; i++) {

        var voiced = floor + 0.2 * Math.max(0, inputChannel[i]);
        outputChannel[i] = tenseness * intensity * voiced + (1-tenseness * intensity ) * 0.3;
      }
    }

    return true;
  }
}

registerProcessor('noise-modulator', NoiseModulator);