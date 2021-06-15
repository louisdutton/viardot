class GlottisProcessor extends AudioWorkletProcessor {
    constructor() { super(); }

    process(inputs, outputs, parameters) {

    }
}

registerProcessor('glottis-processor', GlottisProcessor);