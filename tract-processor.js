class TractProcessor extends AudioWorkletProcessor {
    constructor() { super(); }

    process(inputs, outputs, parameters) {

    }
}

registerProcessor('tract-processor', TractProcessor);