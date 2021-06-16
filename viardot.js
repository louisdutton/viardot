/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Inspired by 'pink trombone' by Neil Thapen 
* attribution is appreciated.
*/

class NoiseModulatorNode extends AudioWorkletNode {
   constructor(context) {
    super(context, 'noise-modulator');

    this.tenseness = this.parameters.get('tenseness');
    this.intensity = this.parameters.get('intensity');
    this.floor = this.parameters.get('floor');
   }
}

class AspiratorNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'aspirator');
    this.tenseness = this.parameters.get('tenseness');
    this.intensity = this.parameters.get('intensity');
  }
}

class TractFilterNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'tract-filter');
  }
}

export class Voice {   
  constructor() {
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    this.context = new window.AudioContext();   
    this.sampleRate = this.context.sampleRate;
    this.audioWorklet = this.context.audioWorklet;
    
    // async import custom audio nodes
    Promise.all([
      this.audioWorklet.addModule('modules/noise-modulator.js'),
      this.audioWorklet.addModule('modules/aspirator.js'),
      this.audioWorklet.addModule('modules/tract-filter.js')
    ]).then(() => this.init());
  }

  init() {
    // master gain
    this.master = this.context.createGain();
    this.master.gain.setValueAtTime(0.05, this.context.currentTime);
    this.master.connect(this.context.destination);
  
    this.tract = new TractFilterNode(this.context);
    this.tract.connect(this.master);

    // replace with custom waveform / wavetable
    this.glottis = this.context.createOscillator();
    this.glottis.type = 'triangle';
    this.glottis.frequency.value = 110;
    this.glottis.connect(this.tract);
    this.glottis.start();

    // vibrato
    this.initVibrato(36, 5);
    // this.initNoise(2 * this.sampleRate);
  }

  setTargetFrequency(value) {
    this.noiseLFO.frequency.value = this.glottis.frequency.value = value;
  }

  initVibrato(depth, rate) {
    this.vibrato = this.context.createGain();
    this.vibrato.gain.value = depth; // vibrato depth in cents
    this.vibrato.connect(this.glottis.detune);

    this.vibratoLFO = this.createLFO(rate, this.vibrato).start();
  }

  initNoise(bufferSize) {
    // 2 seconds of white noise
    this.aspirator = new AspiratorNode(this.context).connect(this.tract);
    this.aspirationGain = this.context.createGain().connect(this.aspirator);

    this.noise = this.context.createBufferSource();
    this.noise.buffer = this.createPinkNoise(bufferSize);
    this.noise.loop = true;
    this.noise.start();

    this.noiseModulator = new NoiseModulatorNode(this.context);
    this.noiseModulator.connect(this.aspirationGain);

    this.noiseLFO = this.createLFO(110, this.noiseModulator).start();
    
    // filters
    this.aspirationFilter = this.createFilter(500).connect(this.aspirator);
    // this.fricativeFilter = this.createFilter(1000).connect(this.tract); // experimental q value
  }

  createLFO(frequency, target) {
    var lfo = this.context.createOscillator();
    lfo.frequency.value = frequency;
    lfo.connect(target);
    return lfo;
  }

  createFilter(frequency, q = 0.5) {
    var filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = q;
    this.noise.connect(filter);
    return filter;
  }

  // Paul Kellet's refined method
  createPinkNoise(frameCount)
  {
    var b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

    var buffer = this.context.createBuffer(1, frameCount, this.sampleRate);
    var channel = buffer.getChannelData(0);
    for (var i = 0; i < frameCount; i++) { 
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      channel[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }
    return buffer;
  }
    
  doScriptProcessor(event)
  {
    for (var n = 0, N = outArray.length; n < N; j++)
    {
      var lambda = n/N;
      var glottalOutput = Glottis.runStep(lambda1, in1[j]); 
      
      Tract.runStep(glottalOutput, in2[n], lambda);
      var vocalOutput = Tract.lipOutput + Tract.noseOutput;
      out[n] = vocalOutput * 0.125;
    }
  }
    
  start() { this.context.resume(); }
  stop() { this.context.suspend(); }
}

// math utils

function clamp(value, a, b) {
    return Math.max(a, Math.min(value, b));
}

function lerp(a, b, t) {
    return a * (1-t) + b * t;
}

function moveTowards(a, b, value)
{
    if (a<b) return Math.min(a+value, b);
    else return Math.max(a-value, b);
}

function moveTowards(a, b, up, down)
{
    if (a<b) return Math.min(a+up, b);
    else return Math.max(a-down, b);
}

/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
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
  ];

function simplex2(random = Math.random) {
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

function simplex(x) { return simplex2(x*1.2, -x*.7); }
