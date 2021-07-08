class Glottis extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
      { name: 'frequency', defaultValue: 440, automationRate: 'a-rate'},
      { name: 'vibrato', defaultValue: 0, automationRate: 'a-rate'},
    ];
  }
  
  constructor() { 
    super();
  
    this.prevFreq = 440;
    this.d = 0;
    this.setupWaveform(0.6);
  }

  setupWaveform(tenseness) {
    var Rd = 3 * (1-tenseness);
    if (Rd<0.5) Rd = 0.5;
    if (Rd>2.7) Rd = 2.7;
    // normalized to time = 1, Ee = 1
    var Ra = -0.01 + 0.048*Rd;
    var Rk = 0.224 + 0.118*Rd;
    var Rg = (Rk/4)*(0.5+1.2*Rk)/(0.11*Rd-Ra*(0.5+1.2*Rk));
    
    var Ta = Ra;
    var Tp = 1 / (2*Rg); // instant of maximum glottal flow
    var Te = Tp + Tp*Rk; //
    
    var epsilon = 1/Ta;
    var shift = Math.exp(-epsilon * (1-Te));
    var Delta = 1 - shift; //divide by this to scale RHS
        
    var RHSIntegral = (1/epsilon)*(shift - 1) + (1-Te)*shift;
    RHSIntegral = RHSIntegral/Delta;
    
    var totalLowerIntegral = - (Te-Tp)/2 + RHSIntegral;
    var totalUpperIntegral = -totalLowerIntegral;
    
    var omega = Math.PI/Tp;
    var s = Math.sin(omega*Te);
    // need E0*e^(alpha*Te)*s = -1 (to meet the return at -1)
    // and E0*e^(alpha*Tp/2) * Tp*2/pi = totalUpperIntegral 
    //             (our approximation of the integral up to Tp)
    // writing x for e^alpha,
    // have E0*x^Te*s = -1 and E0 * x^(Tp/2) * Tp*2/pi = totalUpperIntegral
    // dividing the second by the first,
    // letting y = x^(Tp/2 - Te),
    // y * Tp*2 / (pi*s) = -totalUpperIntegral;
    var y = -Math.PI*s*totalUpperIntegral / (Tp*2);
    var z = Math.log(y);
    var alpha = z/(Tp/2 - Te);
    var E0 = -1 / (s*Math.exp(alpha*Te));
    this.alpha = alpha;
    this.E0 = E0;
    this.epsilon = epsilon;
    this.shift = shift;
    this.Delta = Delta;
    this.Te=Te;
    this.omega = omega;

    this.prevTenseness = tenseness;
    console.log("test");
  }

  normalizedWaveform(t) {
    if (t>this.Te) return (-Math.exp(-this.epsilon * (t-this.Te)) + this.shift)/this.Delta;
    return this.E0 * Math.exp(this.alpha*t) * Math.sin(this.omega * t);
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    // const tenseness = parameters.tenseness[0];
    const freqs = parameters.frequency;
    const vibrato = parameters.vibrato;

    // per buffer
    this.setupWaveform(0.2);
    
    // per sample
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      for (let n = 0; n < 128; n++) {
        var freq =  freqs[0] + vibrato[0];
        var time = currentTime + n / sampleRate;
        this.d += time * (this.prevFreq - freq);
        this.prevFreq = freq;
        const t = time * freq + this.d;
        outputChannel[n] = Math.sin(2 * Math.PI * t);
        // outputChannel[n] = this.normalizedWaveform(t); // WHY WONT THIS FUCKING WORK
      }
    }

    return true;
  }
}

registerProcessor('glottis', Glottis);