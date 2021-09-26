// normal-distrubted noise (mean: 0, sd: 1)
function gaussian() {
    var u = 0, v = 0;
    while (u === 0)
        u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0)
        v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export default class NoiseNode {
    constructor(ctx, duration) {
        // source
        const source = ctx.createBufferSource();
        source.buffer = this.gaussianBuffer(duration, ctx);
        source.loop = true;
        source.start(0);
        // filters
        const aspirationFilter = this.createFilter(ctx, 1000, .7, 'lowpass');
        const fricativeFilter = this.createFilter(ctx, 1000, 0.1);
        // connect source to filters
        source.connect(aspirationFilter);
        source.connect(fricativeFilter);
        // store
        this.source = source;
        this.aspiration = aspirationFilter;
        this.fricative = fricativeFilter;
    }
    createFilter(ctx, frequency, q = 0.67, type = 'bandpass') {
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = q;
        return filter;
    }
    gaussianBuffer(duration, ctx) {
        const bufferSize = duration * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let n = 0; n < channel.length; n++)
            channel[n] = gaussian() * 0.05;
        return buffer;
    }
}
