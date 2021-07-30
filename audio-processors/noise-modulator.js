class NoiseModulator extends AudioWorkletProcessor {
    
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate' }
    ]
  }

  process(IN, OUT, PARAMS) {
    const input = IN[0][0]
    const output = OUT[0][0]
    const intensity = PARAMS.intensity[0]
    const tenseness = PARAMS.tenseness[0]
    const floor = 0.1

    // Single channel input & iutput
    for (let n = 0; n < 128; n++) {
      var voiced = floor + 0.2 * Math.max(0, input[n])
      output[n] = tenseness * intensity * voiced + (1-tenseness * intensity) * 0.3
    }

    return true
  }
}

registerProcessor('noise-modulator', NoiseModulator)