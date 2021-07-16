/*
* Viardot vocal synthesizer by Louis Dutton (louisdutton.com)
* Inspired by 'pink trombone' by Neil Thapen 
* attribution is appreciated.
*/

class NoiseModulatorNode extends AudioWorkletNode {
   constructor(ctx) {
    super(ctx, 'noise-modulator');

    this.tenseness = this.parameters.get('tenseness');
    this.intensity = this.parameters.get('intensity');
    this.floor = this.parameters.get('floor');
   }
}

class GlottisNode extends AudioWorkletNode {
  constructor(ctx) {
   super(ctx, 'glottis', { channelCount: 1, numberOfInputs: 0 });

   this.frequency = this.parameters.get('frequency');
   this.tenseness = this.parameters.get('tenseness');
  }
}


class SimplexNode extends AudioWorkletNode {
  constructor(ctx) {
   super(ctx, 'simplex');
  }
}

class AspiratorNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'aspirator', { numberOfInputs: 2 });
    this.tenseness = this.parameters.get('tenseness');
    this.intensity = this.parameters.get('intensity');
    this.vibrato = this.parameters.get('vibrato');
  }
}

class TractFilterNode extends AudioWorkletNode {
  constructor(ctx) {
    super(ctx, 'tract-filter', { numberOfInputs: 2 });
  }
}

export class Voice {   
  constructor() {
    this.ready = false;
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    this.ctx = new window.AudioContext();   
    this.ctx.suspend();
    this.sampleRate = this.ctx.sampleRate;
    this.audioWorklet = this.ctx.audioWorklet;
    
    // async import custom audio nodes
    console.log('Viardot: Initializing...')
    Promise.all([
      initIPA(),
      this.audioWorklet.addModule('audio-processors/noise-modulator.js'),
      this.audioWorklet.addModule('audio-processors/aspirator.js'),
      this.audioWorklet.addModule('audio-processors/tract-filter.js'),
      this.audioWorklet.addModule('audio-processors/simplex.js'),
      this.audioWorklet.addModule('audio-processors/glottis.js'),
    ]).then(() => this.init());
  }

  init() {
    // master gain
    this.master = this.ctx.createGain();
    this.master.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.master.connect(this.ctx.destination);

    // this.tract = new TractFilterNode(this.ctx);
    // this.tract.connect(this.master);

    // replace with custom waveform / wavetable
    this.glottis = new GlottisNode(this.ctx);
    this.glottis.connect(this.master);
    console.log(this.glottis)

    // vibrato
    this.initVibrato(10, 5);
    this.initNoise(2 * this.sampleRate);
    this.ready = true;
    console.log('Viardot: Intialization complete.')
  }

  setTargetFrequency(value) {
    this.noiseLFO.frequency.value = value;
    this.glottis.frequency.value = value;
  }

  initVibrato(depth, rate) {
    this.vibrato = this.ctx.createGain();
    this.vibrato.gain.value = depth; // vibrato depth in cents
    this.vibrato.connect(this.glottis.frequency);

    this.vibratoLFO = this.createLFO(rate, this.vibrato);
    this.vibratoLFO.start();
  }

  initNoise(bufferSize) {
    this.aspirationGain = this.ctx.createGain();
    this.aspirationGain.connect(this.master);

    this.aspirator = new AspiratorNode(this.ctx);
    this.aspirator.connect(this.aspirationGain);

    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = this.createPinkNoise(bufferSize);
    this.noise.loop = true;
    this.noise.start();

    this.noiseModulator = new NoiseModulatorNode(this.ctx);
    this.noiseModulator.connect(this.aspirationGain.gain);

    this.noiseLFO = this.createLFO(220, this.noiseModulator);
    this.noiseLFO.start();
    
    // filters
    this.aspirationFilter = this.createFilter(500).connect(this.aspirator);
    // this.fricativeFilter = this.createFilter(1000).connect(this.tract, 0, 1); // experimental q value

    // simplex noise
    this.simplex = new SimplexNode(this.ctx);
    this.simplex.connect(this.aspirator, 0, 1);
  }

  createLFO(frequency, target) {
    var lfo = this.ctx.createOscillator();
    lfo.frequency.value = frequency;
    lfo.connect(target);
    return lfo;
  }

  createFilter(frequency, q = 0.5) {
    var filter = this.ctx.createBiquadFilter();
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

    var buffer = this.ctx.createBuffer(1, frameCount, this.sampleRate);
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
    
  start() { this.ctx.resume(); }
  stop() { this.ctx.suspend(); }
}

// IPA dictionary

var DICT = {};
var PHONES = {};
var IPA = {};

export function toPhonemes(word, asIPA = false) { 
  var phonemes = DICT[word.toUpperCase().replace(/[\W\d]/, '')];
  if (phonemes == null) return '';
  if (asIPA) {
    var ipa = '';
    for (var i = 0; i < phonemes.length; i++) {
      ipa += toIPA(phonemes[i]);
    }
    return ipa;
  }
  return phonemes;
}

function initIPA(){
  DICT = parseDictionary('./assets/cmudict-0.7b.txt', true);
  PHONES = parseDictionary('./assets/cmudict-0.7b.phones.txt');
  IPA = parseDictionary('./assets/arpa-to-ipa.txt');
}

function toIPA(phoneme) {
  phoneme = phoneme.replace(/\d/, '');
  return IPA[phoneme];
}

function parseDictionary(dir, arrayValues = false, async = true) {

  var dict = {};
  var xhr = new XMLHttpRequest();
  xhr.open('GET', dir, async);
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) { // ready to parse
      if (xhr.status == 200 || xhr.status == 0) { // file located
        var lines = xhr.responseText.split(/\r?\n|\r/g); // can be simplified if format is known
        for (var i in lines) {
          var arr = lines[i].split(/  /g);
          var value = arrayValues ? arr[1].split(/ /g) : arr[1];
          dict[arr[0]] = value;
        }
      }
    }
  };
  
  xhr.send(null);
  return dict;
}