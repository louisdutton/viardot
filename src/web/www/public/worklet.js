// TODO: Work out wtf us going on with this little boi
const importObject = { env: { __wbindgen_placeholder__: () => {} } };
const BLOCK_SIZE = 128;

class Voice extends AudioWorkletProcessor {
	constructor() {
		super();

		this.port.onmessage = (e) => {
			console.log(e.data);
			WebAssembly.instantiate(e.data, importObject).then((source) => {
				this.wasm = source.instance;
				this.sin = this.wasm.exports.test;
				this.port.postMessage(this.wasm.exports.test(0.5));
				// console.log(source);
				// console.log(this.wasm.exports.test(0.5));
			});
		};

		// this.port.onmessage = (e) => {
		// 	console.log(e.data);
		// 	this.port.postMessage("pong");
		// };
	}

	process(inputs, outputs, parameters) {
		if (!this.wasm) return;

		this.sin();

		return true;
	}
}

registerProcessor("voice", Voice);
