import { worklet } from "./global";
import { Voice } from "./rust/pkg/belcanto";

export const name = "tractFilter";
export const processor = /* javascript */ `class VoiceProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{ name: 'bladePosition', defaultValue: 0.2, automationRate: 'k-rate' },
			{ name: 'bladeDiameter', defaultValue: 0.2, automationRate: 'k-rate' },
			{ name: 'tipPosition', defaultValue: 0.7, automationRate: 'k-rate' },
			{ name: 'tipDiameter', defaultValue: 1, automationRate: 'k-rate' },
			{ name: 'lipDiameter', defaultValue: 0.5, automationRate: 'k-rate' }
		]
	}

	constructor({ processorOptions: { proportions } }) {
		super()
		this.proportions = proportions
		this.port.onmessage = (e) => this.onmessage(e.data)
	}

	onmessage(event) {
		switch (event.type) {
			case 'load-wasm': {
				init(WebAssembly.compile(event.wasmBytes)).then(() => {
					this.port.postMessage({ type: 'wasm-loaded' })
					this.voice = Voice.new(sampleRate, 128)
				})
				break
			}
		}
	}

	process(in_, out, params) {
		const output = out[0][0]

		// params
		const tongueIndex =
			params.tonguePosition[0] * (this.tipStart - this.bladeStart) +
			this.bladeStart
		const tongueDiameter = params.tongueDiameter[0] * this.oralDiameter
		const tipIndex = params.position[0]
		const tipDiameter = params.tipDiameter[0]
		const lipDiameter = params.lipDiameter[0]

		// block start
		// call wasm process

		// block end
		// updateTongue(tongueIndex, tongueDiameter)
		// updateLip(lipDiameter)
		// this.updateConstrictions(tipIndex, tipDiameter)
		// reshapeTract
		// calculateReflectionCoefficients

		// post tract data
		// this.port.postMessage(this.diameter)

		return true
	}
}
`;

worklet.registerProcessor(name, processor);
