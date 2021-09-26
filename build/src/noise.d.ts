import { AudioContext, AudioBufferSourceNode, BiquadFilterNode, TBiquadFilterType } from 'standardized-audio-context';
export default class NoiseNode {
    readonly aspiration: BiquadFilterNode<AudioContext>;
    readonly fricative: BiquadFilterNode<AudioContext>;
    readonly source: AudioBufferSourceNode<AudioContext>;
    constructor(ctx: AudioContext, duration: number);
    createFilter(ctx: AudioContext, frequency: number, q?: number, type?: TBiquadFilterType): import("standardized-audio-context").IBiquadFilterNode<import("standardized-audio-context").IAudioContext>;
    gaussianBuffer(duration: number, ctx: AudioContext): import("standardized-audio-context").IAudioBuffer;
}
