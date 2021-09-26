import { AudioWorkletNode, AudioContext, IAudioParam } from "standardized-audio-context";
import { Fach } from './enums';
export declare class GlottisNode {
    worklet: AudioWorkletNode<AudioContext>;
    readonly tenseness: IAudioParam;
    readonly intensity: IAudioParam;
    readonly frequency: IAudioParam;
    readonly loudness: IAudioParam;
    readonly vibratoRate: IAudioParam;
    readonly vibratoDepth: IAudioParam;
    constructor(ctx: AudioContext);
    start(t: number): void;
    stop(t: number): void;
}
interface TractProportions {
    oralLength: number;
    nasalLength: number;
    maxDiameter: number;
}
export declare class TractFilterNode {
    tongueIndex: IAudioParam;
    tongueDiameter: IAudioParam;
    tipIndex: IAudioParam;
    tipDiameter: IAudioParam;
    lipDiameter: IAudioParam;
    diameter: Float64Array;
    worklet: AudioWorkletNode<AudioContext>;
    constructor(ctx: AudioContext, Fach: Fach);
    calculateProportions(Fach: Fach): TractProportions;
}
export {};
