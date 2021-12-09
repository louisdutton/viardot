import { worklet } from "./global";
import init, { Voice } from "./rust/pkg/belcanto";

export const name = "tractFilter";
export const processor = /* javascript */ `class VoiceProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{ name: 'bladePosition', defaultValue: 0.2, automationRate: 'k-rate' },
			{ name: 'bladeDiameter', defaultValue: 0.2, automationRate: 'k-rate' },
			{ name: 'tipPosition', defaultValue: 0.7, automationRate: 'k-rate' },
			{ name: 'tipDiameter', defaultValue: 1, automationRate: 'k-rate' },
			{ name: 'lipDiameter', defaultValue: 0.5, automationRate: 'k-rate' },
			{ name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate' },
			{ name: 'intensity', defaultValue: 0.0, automationRate: 'k-rate' },
			{ name: 'frequency', defaultValue: 440, automationRate: 'a-rate' },
			{ name: 'vibratoDepth', defaultValue: 8.0, automationRate: 'k-rate' },
			{ name: 'vibratoRate', defaultValue: 6.0, automationRate: 'k-rate' },
			{ name: 'loudness', defaultValue: 0.5, automationRate: 'k-rate' }
		];
	}

	constructor({ processorOptions }) {
		super();
		this.proportions = processorOptions;
		this.port.onmessage = (e) => this.onmessage(e.data);
	}

	onmessage(event) {
		if (event.type === 'load-wasm') {
			init(WebAssembly.compile(event.wasmBytes)).then(() => {
				this.port.postMessage({ type: 'wasm-loaded' });
				this.voice = Voice.new(sampleRate, 128);
			});
		}
	}

	process(in_, out, params) {
		const output = out[0][0];

    if (!this.voice) return;
		// params
		const bladePosition = params.bladePosition[0];
		const tongueDiameter = params.bladeDiameter[0];
		const tipPosition = params.tipPosition[0];
		const tipDiameter = params.tipDiameter[0];
		const lipDiameter = params.lipDiameter[0];

		// block start
		// call wasm process
		const sample = this.voice.process(currentTime);

		// block end
		// updateTongue(tongueIndex, tongueDiameter)
		// updateLip(lipDiameter)
		// this.updateConstrictions(tipIndex, tipDiameter)
		// reshapeTract
		// calculateReflectionCoefficients

		// post tract data
		// this.port.postMessage(this.diameter)

		return true;
	}
}
`;

worklet.registerProcessor(name, processor);
