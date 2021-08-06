import { makeNoise2D } from "fast-simplex-noise";

class Glottis extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
      { name: 'frequency', defaultValue: 440, automationRate: 'a-rate'},
      { name: 'vibratoDepth', defaultValue: 5.5, automationRate: 'a-rate'},
      { name: 'vibratoRate', defaultValue: 5.2, automationRate: 'a-rate'},
      { name: 'loudness', defaultValue: 1.0, automationRate: 'k-rate'},
    ]
  }
  
  constructor() { 
    super()
  
    this.prevFreq = 440
    this.d = 0
    this.setupWaveform(0)
    var simplex2D = makeNoise2D(Math.random)
    this.simplex = (t) => simplex2D(t*1.2, t*0.7)
  }

  setupWaveform(tenseness) {
    
    this.Rd = 3*(1-tenseness)
    var Rd = this.Rd
    if (Rd<0.5) Rd = 0.5
    if (Rd>2.7) Rd = 2.7

    // normalized to time = 1, Ee = 1
    var Ra = -0.01 + 0.048*Rd
    var Rk = 0.224 + 0.118*Rd
    var Rg = (Rk/4)*(0.5+1.2*Rk)/(0.11*Rd-Ra*(0.5+1.2*Rk))
    
    var Ta = Ra
    var Tp = 1 / (2*Rg) // instant of maximum glottal flow
    var Te = Tp + Tp*Rk //
    
    var epsilon = 1/Ta
    var shift = Math.exp(-epsilon * (1-Te))
    var Delta = 1 - shift //divide by this to scale RHS
        
    var RHSIntegral = (1/epsilon)*(shift - 1) + (1-Te)*shift
    RHSIntegral = RHSIntegral/Delta
    
    var totalLowerIntegral = -(Te-Tp)/2 + RHSIntegral
    var totalUpperIntegral = -totalLowerIntegral
    
    var omega = Math.PI/Tp
    var s = Math.sin(omega*Te)
    
    var y = -Math.PI*s*totalUpperIntegral / (Tp*2)
    var z = Math.log(y)
    var alpha = z/(Tp/2 - Te)
    var E0 = -1 / (s*Math.exp(alpha*Te))

    this.alpha = alpha
    this.E0 = E0
    this.epsilon = epsilon
    this.shift = shift
    this.Delta = Delta
    this.Te=Te
    this.omega = omega
  }

  normalizedWaveform(t) {
    if (t>this.Te) return (-Math.exp(-this.epsilon * (t-this.Te)) + this.shift)/this.Delta
    return this.E0 * Math.exp(this.alpha*t) * Math.sin(this.omega * t)
  }

  vibrato(rate, depth) {
    var t = currentTime
    var vibrato = depth * Math.sin(2*Math.PI * t * rate);
    vibrato += this.simplex(t * 0.5) * 4
    vibrato += this.simplex(t * 2) * 1
    return vibrato
  }

  process(IN, OUT, PARAMS) {
    const output = OUT[0][0]
    
    const intensity = PARAMS.intensity[0]
    const loudness = PARAMS.loudness[0]
    const frequency = PARAMS.frequency
    var freq = frequency[0]
    

    // pre block
    const tenseness = PARAMS.tenseness[0]
    this.setupWaveform(tenseness)
    
    // block
    for (let n = 0; n < 128; n++) {
      
      var vibratoRate = PARAMS.vibratoRate[0]
      var vibratoDepth = PARAMS.vibratoDepth[0]
      var vibrato = this.vibrato(vibratoRate, vibratoDepth)
      const f0 = freq + vibrato
      var frame = (currentFrame + n) / sampleRate
      this.d += frame * (this.prevFreq - f0)
      this.prevFreq = f0
      var t = (frame * f0 + this.d) % 1
      output[n] = this.normalizedWaveform(t) * intensity * loudness
    }

    // post block
    // intensity

    return true
  }
}

registerProcessor('glottis', Glottis)