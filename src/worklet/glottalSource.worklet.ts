import './utils'
import { worklet } from "../global"

export const name = 'glottalSource'
export const processor = /* javascript */`
  class GlottalSourceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
        { name: 'intensity', defaultValue: 0.0, automationRate: 'k-rate'},
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
      const shift = exp(-epsilon * (1-Te))
      const Delta = 1 - shift //divide by this to scale RHS
          
      const RHSIntegral = ((1/epsilon)*(shift - 1) + (1-Te)*shift) / Delta
      
      const totalLowerIntegral = -(Te-Tp)/2 + RHSIntegral
      const totalUpperIntegral = -totalLowerIntegral
      
      const omega = PI/Tp
      const s = sin(omega*Te)
      
      const y = -PI*s*totalUpperIntegral / (Tp*2)
      const z = log(y)
      const alpha = z/(Tp/2 - Te)
      const E0 = -1 / (s*exp(alpha*Te))

      // normalized waveform function
      return t => (t>Te)
        ? (-exp(-epsilon * (t-Te)) + shift)/Delta
        : E0 * exp(alpha*t) * sin(omega*t)
    }

    vibrato(rate, depth, simplexA, simplexB) {
      const t = currentTime
      let vibrato = depth * sin(PI2 * t * rate)
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
      const floor = .15
      const amplitude = .2
      
      // Pre block
      const tenseness = PARAMS.tenseness[0]
      if (tenseness !== this.prevTenseness)
        this.waveform = this.transformedLF(tenseness)


      const vibratoRate = PARAMS.vibratoRate[0]
      // const vibratoDepth = PARAMS.vibratoDepth[0]
      const vibratoDepth = 0.03 * frequency
      
      // In block
      for (let n = 0; n < 128; n++) {
        // simplex noise
        const s1 = simplex(currentTime * 1.4)
        const s2 = simplex(currentTime * 4.2)

        // excitation
        const vibrato = this.vibrato(vibratoRate, vibratoDepth, s1, s2)
        const f0 = frequency + vibrato
        const frame = (currentFrame + n) / sampleRate
        this.d += frame * (this.prevFreq - f0)
        this.prevFreq = f0
        const t = (frame * f0 + this.d) % 1
        const excitation = this.waveform(t)

        // aspiration
        const modulation = floor + amplitude * hanning(t, f0)
        const noiseResidual = input[n] * (1+s2*.25) * modulation * sqrt(tenseness)

        output[n] = (excitation + noiseResidual) * intensity * loudness
      }

      return true
    }
  }
`

worklet.registerProcessor(name, processor)