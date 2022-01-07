/* tslint:disable */
/* eslint-disable */
/**
*/
export class Voice {
  free(): void;
/**
* @param {number} sample_rate
* @param {number} block_size
* @returns {Voice}
*/
  static new(sample_rate: number, block_size: number): Voice;
/**
* @param {number} time
* @returns {Float64Array}
*/
  process(time: number): Float64Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_voice_free: (a: number) => void;
  readonly voice_new: (a: number, b: number) => number;
  readonly voice_process: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
