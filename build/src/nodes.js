import { AudioWorkletNode } from "standardized-audio-context";
export class GlottisNode {
    // private active: boolean
    constructor(ctx) {
        this.worklet = new AudioWorkletNode(ctx, 'glottis', {
            channelCount: 1,
            numberOfInputs: 1,
            numberOfOutputs: 1
        });
        this.tenseness = this.worklet.parameters.get('tenseness');
        this.intensity = this.worklet.parameters.get('intensity');
        this.frequency = this.worklet.parameters.get('frequency');
        this.loudness = this.worklet.parameters.get('loudness');
        this.vibratoRate = this.worklet.parameters.get('vibratoRate');
        this.vibratoDepth = this.worklet.parameters.get('vibratoDepth');
        // this.active = false
    }
    start(t) {
        this.intensity.cancelScheduledValues(0);
        this.intensity.exponentialRampToValueAtTime(1, t + .25);
    }
    stop(t) {
        this.intensity.cancelScheduledValues(0);
        this.intensity.exponentialRampToValueAtTime(0.0001, t + .25);
    }
}
export class TractFilterNode {
    constructor(ctx, Fach) {
        const proportions = this.calculateProportions(Fach);
        this.worklet = new AudioWorkletNode(ctx, 'tract', {
            numberOfInputs: 2,
            processorOptions: { proportions: proportions }
        });
        this.tongueIndex = this.worklet.parameters.get('tongueIndex');
        this.tongueDiameter = this.worklet.parameters.get('tongueDiameter');
        this.tipIndex = this.worklet.parameters.get('tipIndex');
        this.tipDiameter = this.worklet.parameters.get('tipDiameter');
        this.lipDiameter = this.worklet.parameters.get('lipDiameter');
        this.diameter = new Float64Array(proportions.oralLength);
        this.worklet.port.onmessage = (msg) => this.diameter = msg.data;
    }
    calculateProportions(Fach) {
        return TRACT_PROPORTIONS[Fach];
    }
}
const TRACT_PROPORTIONS = [
    {
        oralLength: 40,
        nasalLength: 28,
        maxDiameter: 4,
    },
    {
        oralLength: 42,
        nasalLength: 28,
        maxDiameter: 4,
    },
    {
        oralLength: 44,
        nasalLength: 28,
        maxDiameter: 4,
    },
    {
        oralLength: 50,
        nasalLength: 28,
        maxDiameter: 3.5,
    },
    {
        oralLength: 56,
        nasalLength: 28,
        maxDiameter: 4,
    },
    {
        oralLength: 58,
        nasalLength: 40,
        maxDiameter: 3.5,
    }
];
