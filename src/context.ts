import Freeverb from './freeverb'

export default class Context {
  private raw: AudioContext
  private worklet: AudioWorklet
  public master: GainNode
  public sampleRate: number
  private reverb: Reverb
  public analyser: AnalyserNode
  public bufferLength: number
  public dataArray: Uint8Array

  constructor() {
    this.raw = new AudioContext()
    this.worklet = this.raw.audioWorklet

    this.reverb = Freeverb(this.raw) as Reverb
    this.reverb.connect(this.raw.destination)
    this.setReverb() // default settings

    this.analyser = this.raw.createAnalyser();
    this.analyser.fftSize = 2048;
    
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.analyser.getByteTimeDomainData(this.dataArray);

    const filter = this.raw.createBiquadFilter()
    filter.Q.value = 5
    filter.frequency.value = 2000
    filter.type = 'lowpass'
    filter.connect(this.reverb)
    filter.connect(this.analyser)

    this.master = this.raw.createGain()
    this.master.gain.value = .075
    this.master.connect(filter)
    // this.master.connect(this.analyser)
    this.sampleRate = this.raw.sampleRate
  }

  resume = () => this.raw.resume()
  suspend = () => this.raw.suspend()
  now = () => this.raw.currentTime

  setReverb(roomSize = .5, dampening = 2500, wet = .3, dry = .7) {
    this.reverb.roomSize = roomSize
    this.reverb.dampening = dampening
    this.reverb.wet.value = wet
    this.reverb.dry.value = dry
  }

  addModule = (url: string, name: string) => this.worklet.addModule(url + '/' + name + '.js')

  createBufferSource(): AudioBufferSourceNode {
    return this.raw.createBufferSource()
  }

  createBuffer(numberOfChannels: number, length: number): AudioBuffer {
    return this.raw.createBuffer(numberOfChannels, length, this.sampleRate)
  }

  createBiquadFilter(frequency: number, q=0.6, type: BiquadFilterType='bandpass'): BiquadFilterNode {
    const filter = this.raw.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = q
    return filter
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
		if (!this.modules.has(name))
			this.modules.set(name, this.raw.audioWorklet.addModule(url));

		await this.modules.get(name);
	}

	/** Returns a promise which resolves when all of the worklets have been loaded. */
	protected async workletsAreReady(): Promise<void> {
		const promises: Promise<void>[] = [];
		this.modules.forEach((promise) => promises.push(promise));
		await Promise.all(promises);
	}
}

interface Reverb extends AudioNode {
  roomSize: number
  dampening: number
  wet: AudioParam
  dry: AudioParam
}