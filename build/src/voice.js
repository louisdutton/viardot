var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import NoiseNode from './noise';
import { Fach } from './enums';
import { PhonemeToTonguePosition } from './dictionaries';
import { AudioContext } from 'standardized-audio-context';
import { TractFilterNode, GlottisNode } from './nodes';
import Freeverb from 'freeverb';
let $audioContext;
let $master;
let $reverb;
const workletModules = ['tract', 'glottis'];
export const Start = () => __awaiter(void 0, void 0, void 0, function* () {
    const ctx = $audioContext = new AudioContext();
    // global master gain
    $master = ctx.createGain();
    $master.gain.setValueAtTime(0.05, ctx.currentTime);
    $master.connect(ctx.destination);
    // global reverb
    $reverb = Freeverb(ctx);
    $reverb.roomSize = 0.9;
    $reverb.dampening = 7000;
    $reverb.wet.value = .2;
    $reverb.dry.value = .8;
    $reverb.connect($master);
    const workletPath = 'worklets/';
    console.log('[viardot] Initializing...');
    const audioWorklet = ctx.audioWorklet;
    return Promise.all(workletModules.map(m => audioWorklet === null || audioWorklet === void 0 ? void 0 : audioWorklet.addModule(workletPath + m + '.js')));
});
/**
 * Monophonic vocal synthesizer.
 * @example
 * const voice = new Voice(FACH.SOPRANO)
 * voice.start('C4')
 */
export class Voice {
    /**
     *
     * @param  {Fach}     fach        Voice type
     * @param  {Function} onComplete  Completion callback
     */
    constructor(fach) {
        var _a, _b;
        this.getTractData = () => {
            // this.tract.worklet.port.postMessage(null)
            return this.tract.diameter;
        };
        this.recieve = (phones) => { console.log(phones); };
        // if (!$audioContext) return
        const ctx = $audioContext;
        this.fach = fach;
        this.range = getVocalRange(fach);
        const tract = new TractFilterNode(ctx, this.fach);
        (_a = tract.worklet) === null || _a === void 0 ? void 0 : _a.connect($reverb);
        // Glottal source
        const glottis = new GlottisNode(ctx);
        glottis.vibratoRate.value = 5.5 + Math.random() * .5;
        glottis.vibratoDepth.value = 6; // pitch extent (amplitude)
        (_b = glottis.worklet) === null || _b === void 0 ? void 0 : _b.connect(tract.worklet, 0, 0);
        // Noise
        const noise = new NoiseNode(ctx, 2);
        noise.fricative.connect(tract.worklet, 0, 1);
        noise.aspiration.connect(glottis.worklet);
        // Store
        this.ctx = ctx;
        this.tract = tract;
        this.glottis = glottis;
        this.portamento = 0.2;
        this.setIntensity(1);
        this.stop();
        // this.setFrequency(0)
    }
    setFrequency(value) {
        // const freq = this.range.bottom + value * (this.range.top - this.range.bottom)
        const freq = value;
        this.glottis.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + this.portamento);
        // this.setIntensity(1-(freq / (this.range.top - this.range.bottom)))
    }
    setIntensity(value) {
        const tenseness = value * 0.7;
        this.glottis.tenseness.value = tenseness;
        this.glottis.loudness.value = Math.pow(value, 0.5);
    }
    setPhoneme(key) {
        const values = PhonemeToTonguePosition[key];
        this.setTongue(values[0], values[1]);
    }
    setTongue(index, diameter) {
        this.tract.tongueIndex.value = index;
        this.tract.tongueDiameter.value = diameter;
    }
    setIndex(index) {
        this.tract.tongueIndex.value = index;
    }
    setDiameter(diameter) {
        this.tract.tongueDiameter.value = diameter;
    }
    setLipTarget(diameter) {
        this.tract.lipDiameter.value = diameter;
    }
    start() {
        this.ctx.resume();
        this.glottis.start(this.ctx.currentTime);
    }
    stop() {
        this.glottis.stop(this.ctx.currentTime);
    }
}
function getVocalRange(fach) {
    switch (fach) {
        case Fach.Soprano: return { bottom: 261.63, top: 1046.50 };
        case Fach.Mezzo: return { bottom: 196.00, top: 880.00 };
        case Fach.Contralto: return { bottom: 174.61, top: 698.46 };
        case Fach.Tenor: return { bottom: 130.81, top: 525.25 };
        case Fach.Baritone: return { bottom: 98.00, top: 392.00 };
        case Fach.Bass: return { bottom: 41.20, top: 329.63 };
    }
}
