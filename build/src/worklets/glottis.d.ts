declare function makeNoise2D(random: any): (x: any, y: any) => number;
declare function makeNoise2D(random: any): (x: any, y: any) => number;
declare const G2: number;
declare const Grad: number[][];
declare class Glottis {
    static get parameterDescriptors(): {
        name: string;
        defaultValue: number;
        automationRate: string;
    }[];
    prevFreq: number;
    prevTenseness: number;
    d: number;
    waveform: (t: any) => number;
    /**
     * Creates an waveform model glottal function based on tenseness variable
     * @author
     * @param {tenseness} tenseness dependent variable controlling interpolation between pressed and breathy glottal action
     * @returns The function for the normalized waveform waveform
     */
    transformedLF(tenseness: any): (t: any) => number;
    vibrato(rate: any, depth: any, simplexA: any, simplexB: any): number;
    process(IN: any, OUT: any, PARAMS: any): boolean;
}
