export default class Context {
  public raw: AudioContext;
  private worklet: AudioWorklet;
  public master: GainNode;
  public sampleRate: number;
  public wasmBytes!: ArrayBuffer;

  constructor() {
    this.raw = new AudioContext();
    this.worklet = this.raw.audioWorklet;

    this.master = this.raw.createGain();
    this.master.gain.value = 0.075;
    this.master.connect(this.raw.destination);
    this.sampleRate = this.raw.sampleRate;

    this.loadWasm().then((wasm) => (this.wasmBytes = wasm));
  }

  async loadWasm() {
    const response = await window.fetch("/belcanto/src/rust/pkg/belcanto_bg.wasm");
    const wasmBytes = await response.arrayBuffer();
    return wasmBytes;
  }

  resume = () => this.raw.resume();
  suspend = () => this.raw.suspend();
  now = () => this.raw.currentTime;

  addModule = (url: string, name: string) => this.worklet.addModule(url + "/" + name + ".js");

  createBufferSource(): AudioBufferSourceNode {
    return this.raw.createBufferSource();
  }

  createBuffer(numberOfChannels: number, length: number): AudioBuffer {
    return this.raw.createBuffer(numberOfChannels, length, this.sampleRate);
  }

  createAnalyser() {
    return this.raw.createAnalyser();
  }

  createGain() {
    return this.raw.createGain();
  }

  createBiquadFilter(frequency: number, q = 0.6, type: BiquadFilterType = "bandpass"): BiquadFilterNode {
    const filter = this.raw.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
  }

  /** Maps a module name to promise of the addModule method */
  private modules: Map<string, Promise<void>> = new Map();

  /**
   * Create an audio worklet node from a name and options. The module
   * must first be loaded using [[addAudioWorkletModule]].
   */
  createAudioWorkletNode(name: string, options?: Partial<AudioWorkletNodeOptions>): AudioWorkletNode {
    return new AudioWorkletNode(this.raw, name, options);
  }

  /**
   * Add an AudioWorkletProcessor module
   * @param url The url of the module
   * @param name The name of the module
   */
  async addAudioWorkletModule(url: string, name: string): Promise<void> {
    if (!this.modules.has(name)) this.modules.set(name, this.raw.audioWorklet.addModule(url));

    await this.modules.get(name);
  }

  /** Returns a promise which resolves when all of the worklets have been loaded. */
  protected async workletsAreReady(): Promise<void> {
    const promises: Promise<void>[] = [];
    this.modules.forEach((promise) => promises.push(promise));
    await Promise.all(promises);
  }
}
