export class NoiseModulatorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.frequency = this.parameters.get('frequency')
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

export class GlottisNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'glottis', { channelCount: 1, numberOfInputs: 0, numberOfOutputs: 1 })
    this.frequency = this.parameters.get('frequency')
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.loudness = this.parameters.get('loudness')
    this.vibratoRate = this.parameters.get('vibratoRate')
    this.vibratoDepth = this.parameters.get('vibratoDepth')
    this.active = false
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

export class AspiratorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
  }

  start(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(1, t + 0.1)
  }

  stop(t) {
    this.intensity.cancelScheduledValues(0)
    this.intensity.exponentialRampToValueAtTime(0.0001, t + 0.5)
  }
}

export class TractFilterNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'tract', { numberOfInputs: 2 })
    this.intensity = this.parameters.get('intensity')
    this.tenseness = this.parameters.get('tenseness')
    this.tongueIndex = this.parameters.get('tongueIndex')
    this.tongueDiameter = this.parameters.get('tongueDiameter')
    this.tipIndex = this.parameters.get('tipIndex')
    this.tipDiameter = this.parameters.get('tipDiameter')
  }
}