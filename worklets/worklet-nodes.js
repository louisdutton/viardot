export class NoiseModulatorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'noise-modulator', { numberOfInputs: 1, numberOfOutputs: 2 })

    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.floor = this.parameters.get('floor')
  }
}

export class GlottisNode extends AudioWorkletNode {
  constructor(ctx) {
  super(ctx, 'glottis', { channelCount: 1, numberOfInputs: 0, numberOfOutputs: 1 })

    this.frequency = this.parameters.get('frequency')
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
    this.vibratoRate = this.parameters.get('vibratoRate')
    this.vibratoDepth = this.parameters.get('vibratoRate')
  }
}

export class AspiratorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'aspirator', { numberOfInputs: 1 })
    this.tenseness = this.parameters.get('tenseness')
    this.intensity = this.parameters.get('intensity')
  }
}

export class TractFilterNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'tract', { numberOfInputs: 2 })
    this.intensity = this.parameters.get('intensity')
    this.tenseness = this.parameters.get('tenseness')
    this.tongueIndex = this.parameters.get('tongueIndex')
    this.tongueDiameter = this.parameters.get('tongueDiameter')
  }
}