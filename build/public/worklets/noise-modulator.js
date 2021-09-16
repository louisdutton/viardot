class NoiseModulator extends AudioWorkletProcessor {
    
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
      { name: 'intensity', defaultValue: 0.0, automationRate: 'k-rate' },
      { name: 'frequency', defaultValue: 440, automationRate: 'k-rate' },
    ]
  }

  process(IN, OUT, PARAMS) {
    const input = IN[0][0]
    const output = OUT[0][0]
    const intensity = PARAMS.intensity[0]
    // const tenseness = PARAMS.tenseness[0]
    const floor = .05
    const amplitude = .2 // An
    const frequency = PARAMS.frequency[0]

    // Single channel input & iutput
    for (let n = 0; n < 128; n++) {
      const t = currentTime
      // hanning window
      const residual = floor + amplitude * (1 - Math.cos(2*Math.PI * t * frequency)) / 2 
      output[n] = input[n] * residual * intensity
    }

    return true
  }
}

registerProcessor('noise-modulator', NoiseModulator)