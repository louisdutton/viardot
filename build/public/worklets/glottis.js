"use strict"

/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G2 = (3.0 - Math.sqrt(3.0)) / 6.0
const Grad = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0, 1],
    [0, -1],
]
function makeNoise2D(random) {
    if (random === void 0) { random = Math.random }
    const p = new Uint8Array(256)
    for (let i = 0 ;i < 256; i++)
        p[i] = i
    let n
    let q
    for (let i = 255; i > 0; i--) {
        n = Math.floor((i + 1) * random())
        q = p[i]
        p[i] = p[n]
        p[n] = q
    }
    const perm = new Uint8Array(512)
    const permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255]
        permMod12[i] = perm[i] % 12
    }
    return function (x, y) {
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0) // Hairy factor for 2D
        const i = Math.floor(x + s)
        const j = Math.floor(y + s)
        const t = (i + j) * G2
        const X0 = i - t // Unskew the cell origin back to (x,y) space
        const Y0 = j - t
        const x0 = x - X0 // The x,y distances from the cell origin
        const y0 = y - Y0
        // Determine which simplex we are in.
        const i1 = x0 > y0 ? 1 : 0
        const j1 = x0 > y0 ? 0 : 1
        // Offsets for corners
        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1.0 + 2.0 * G2
        const y2 = y0 - 1.0 + 2.0 * G2
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255
        const jj = j & 255
        const g0 = Grad[permMod12[ii + perm[jj]]]
        const g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]]
        const g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]]
        // Calculate the contribution from the three corners
        const t0 = 0.5 - x0 * x0 - y0 * y0
        const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0)
        const t1 = 0.5 - x1 * x1 - y1 * y1
        const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1)
        const t2 = 0.5 - x2 * x2 - y2 * y2
        const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2)
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1]
        return 70.14805770653952 * (n0 + n1 + n2)
    }
}

// Additional math functions
Math.simplex2D = makeNoise2D(Math.random)
Math.simplex = t => Math.simplex2D(t*1.2, t*0.7)
Math.PI2 = Math.PI * 2
Math.hanning = (t, frequency) => (1 - Math.cos(Math.PI2 * t * frequency)) / 2

class Glottis extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
      { name: 'frequency', defaultValue: 440, automationRate: 'a-rate'},
      { name: 'vibratoDepth', defaultValue: 8.0, automationRate: 'k-rate'},
      { name: 'vibratoRate', defaultValue: 6.0, automationRate: 'k-rate'},
      { name: 'loudness', defaultValue: 1.0, automationRate: 'k-rate'},
    ]
  }
  
  constructor() { 
    super()
  
    this.prevFreq = 440
    this.prevTenseness = 0;
    this.d = 0
    this.waveform = this.transformedLF(0)
  }

  /**
   * Creates an waveform model glottal function based on tenseness variable
   * @author 
   * @param {tenseness} tenseness dependent variable controlling interpolation between pressed and breathy glottal action
   * @returns The function for the normalized waveform waveform 
   */
  transformedLF(tenseness) {
    // convert tenseness to Rd variable
    let Rd = .5 + 2.2 * (1-tenseness) // must be in range: [.5, 2.7]

    // normalized to time = 1, Ee = 1
    const Ra = -.01 + .048*Rd
    const Rk = .224 + .118*Rd
    const Rg = (Rk/4) * (.5+1.2*Rk) / (.11*Rd-Ra*(.5+1.2*Rk))
    
    // Timing parameters
    const Ta = Ra
    const Tp = 1 / (2*Rg) // instant of maximum glottal flow
    const Te = Tp + Tp*Rk //
    
    const epsilon = 1/Ta
    const shift = Math.exp(-epsilon * (1-Te))
    const Delta = 1 - shift //divide by this to scale RHS
        
    const RHSIntegral = ((1/epsilon)*(shift - 1) + (1-Te)*shift) / Delta
    
    const totalLowerIntegral = -(Te-Tp)/2 + RHSIntegral
    const totalUpperIntegral = -totalLowerIntegral
    
    const omega = Math.PI/Tp
    const s = Math.sin(omega*Te)
    
    const y = -Math.PI*s*totalUpperIntegral / (Tp*2)
    const z = Math.log(y)
    const alpha = z/(Tp/2 - Te)
    const E0 = -1 / (s*Math.exp(alpha*Te))

    // normalized waveform function
    return t => (t>Te)
      ? (-Math.exp(-epsilon * (t-Te)) + shift)/Delta
      : E0 * Math.exp(alpha*t) * Math.sin(omega*t)
  }

  vibrato(rate, depth) {
    const t = currentTime
    const simplexA = Math.simplex(t * 1.4)
    const simplexB = Math.simplex(t * 2.7)
    let vibrato = depth * Math.sin(Math.PI2 * t * rate)
    vibrato += simplexA * depth/2 + simplexB * depth/3
    return vibrato
  }

  process(IN, OUT, PARAMS) {
    const input = IN[0][0]
    const output = OUT[0][0]

    // General params
    const intensity = PARAMS.intensity[0]
    const loudness = PARAMS.loudness[0]
    const frequency = PARAMS.frequency[0]

    // Noise params
    const floor = .5
    const amplitude = .4
    
    // Pre block
    const tenseness = PARAMS.tenseness[0]
    if (tenseness !== this.prevTenseness)
      this.waveform = this.transformedLF(tenseness)


    const vibratoRate = PARAMS.vibratoRate[0]
    const vibratoDepth = PARAMS.vibratoDepth[0]
    
    // In block
    for (let n = 0; n < 128; n++) {
      // excitation
      const vibrato = this.vibrato(vibratoRate, vibratoDepth)
      const f0 = frequency + vibrato
      const frame = (currentFrame + n) / sampleRate
      this.d += frame * (this.prevFreq - f0)
      this.prevFreq = f0
      const t = (frame * f0 + this.d) % 1
      const excitation = this.waveform(t) * intensity * loudness

      // aspiration
      const modulation = floor + amplitude * Math.hanning(t, f0)
      const noiseResidual = input[n] * modulation * intensity

      output[n] = excitation + noiseResidual
    }

    return true
  }
}

registerProcessor('glottis', Glottis)