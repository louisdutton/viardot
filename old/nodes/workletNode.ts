import { worklet } from "../global"
import Context from "../context"

export default abstract class WorkletNode {
  public worklet!: AudioWorkletNode

  /** Invoked when the module is loaded and the node is created */
  protected abstract onready(node: AudioWorkletNode): void

  constructor(ctx: Context, name: string, options: AudioWorkletNodeOptions) {
    // Get worklet directory regardless of location
    const url = worklet.getScope()

    // add worklet processor to AudioWorklet, create node then signal ready
    ctx.addAudioWorkletModule(url, name).then(() => {
      this.worklet = ctx.createAudioWorkletNode(name, options)
      this.onready(this.worklet)
    })
  }

  dispose(): this {
    if (this.worklet) {
      this.worklet.port.postMessage("dispose")
      this.worklet.disconnect()
    }
    return this
  }

  connect(destinationNode: AudioNode) {
    this.worklet?.connect(destinationNode)
  }
}
