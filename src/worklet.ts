/** Interface for the AudioWorklet global scope. */
export default class Worklet {
  /** All of the classes or functions which are loaded into the AudioWorkletGlobalScope */
  private context: Set<string> = new Set();

  /** Add a class to the AudioWorkletGlobalScope */
  add = (javascript: string) => this.context.add(javascript)
  
  /** Register a processor in the AudioWorkletGlobalScope with the given name */
  registerProcessor(name: string, classDesc: string) {
    const processor = /* javascript */`registerProcessor("${name}", ${classDesc})`;
    this.context.add(processor);
  }
  
  /** Get all of the modules which have been registered to the global AudioWorklet scope */
  getScope = (): string => {
    const blob = new Blob([Array.from(this.context).join("\n")], { type: "text/javascript" })
    return URL.createObjectURL(blob)
  }

  // constructor() {
  //   // console.log(this.getScope());
  // }
}