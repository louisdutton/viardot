class NoiseModulator extends AudioWorkletProcessor {
    
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate' },
      { name: 'frequency', defaultValue: 440, automationRate: 'k-rate' },
    ]
  }

  process(IN, OUT, PARAMS) {
    // const input = IN[0][0]
    const output = OUT[0][0]
    const intensity = PARAMS.intensity[0]
    const tenseness = PARAMS.tenseness[0]
    const floor = 0.1
    const amplitude = 0.2
    const frequency = PARAMS.frequency[0]

    // Single channel input & iutput
    for (let n = 0; n < 128; n++) {
      const t = currentTime
      var voiced = floor + (amplitude * Math.max(0, Math.sin(2*Math.PI * t * frequency)))
      output[n] = tenseness * intensity * voiced + (1-tenseness * intensity) * 0.3
    }

    return true
  }
}

registerProcessor('noise-modulator', NoiseModulator)