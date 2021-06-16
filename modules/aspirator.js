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
    const intensity = parameters.intensity;
    const tenseness = parameters.tenseness;

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let n = 0; n < inputChannel.length; n++) {

        var aspiration = intensity * (1-Math.sqrt(tenseness)) * inputChannel[n];
        aspiration *= 0.2 + 0.02 * simplex(currentTime * 1.99);
        outputChannel[n] = aspiration;
        // outputChannel[n] = 0;
      }
    }

    return true;
  }
}

registerProcessor('aspirator', Aspirator);