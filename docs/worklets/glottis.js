"use strict";
/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
var Grad = [
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
];
function makeNoise2D(random) {
    if (random === void 0) { random = Math.random; }
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++)
        p[i] = i;
    var n;
    var q;
    for (var i = 255; i > 0; i--) {
        n = Math.floor((i + 1) * random());
        q = p[i];
        p[i] = p[n];
        p[n] = q;
    }
    var perm = new Uint8Array(512);
    var permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = perm[i] % 12;
    }
    return function (x, y) {
        // Skew the input space to determine which simplex cell we're in
        var s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0); // Hairy factor for 2D
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = x - X0; // The x,y distances from the cell origin
        var y0 = y - Y0;
        // Determine which simplex we are in.
        var i1 = x0 > y0 ? 1 : 0;
        var j1 = x0 > y0 ? 0 : 1;
        // Offsets for corners
        var x1 = x0 - i1 + G2;
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2;
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var g0 = Grad[permMod12[ii + perm[jj]]];
        var g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]];
        var g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]];
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        var n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0);
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        var n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1);
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        var n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2);
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1]
        return 70.14805770653952 * (n0 + n1 + n2);
    };
}

class Glottis extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
      { name: 'frequency', defaultValue: 440, automationRate: 'a-rate'},
      { name: 'vibratoDepth', defaultValue: 6, automationRate: 'a-rate'},
      { name: 'vibratoRate', defaultValue: 5.8, automationRate: 'a-rate'},
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
    // vibrato += this.simplex(t * 0.5) * 4
    // vibrato += this.simplex(t * 2) * 1
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

    return true
  }
}

registerProcessor('glottis', Glottis)