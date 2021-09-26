import { Fach } from './enums';
export declare const Start: () => Promise<void[]>;
/**
 * Monophonic vocal synthesizer.
 * @example
 * const voice = new Voice(FACH.SOPRANO)
 * voice.start('C4')
 */
export declare class Voice {
    private readonly ctx;
    private tract;
    private glottis;
    readonly fach: Fach;
    readonly range: IVocalRange;
    portamento: number;
    /**
     *
     * @param  {Fach}     fach        Voice type
     * @param  {Function} onComplete  Completion callback
     */
    constructor(fach: Fach);
    getTractData: () => Float64Array;
    setFrequency(value: number): void;
    setIntensity(value: number): void;
    setPhoneme(key: string): void;
    setTongue(index: number, diameter: number): void;
    setIndex(index: number): void;
    setDiameter(diameter: number): void;
    setLipTarget(diameter: number): void;
    start(): void;
    stop(): void;
    recieve: (phones: any) => void;
}
interface IVocalRange {
    bottom: number;
    top: number;
    passagio?: {
        primo: number;
        secondo: number;
    };
}
export {};
