const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 })

const table = new WebAssembly.Table({
	initial: 1,
	maximum: 1,
	element: 'anyfunc'
})

const asmLibraryArg = {
	__handle_stack_overflow: () => {},
	emscripten_resize_heap: () => {},
	__lock: () => {},
	__unlock: () => {},
	memory: memory,
	table: table
}

const info = {
	env: asmLibraryArg,
	wasi_snapshot_preview1: asmLibraryArg
}

type WasmFunctions = {
  add: Function
}

export async function getWasmExports() {
	const res = await fetch('lib/functions.wasm')
	const bytes = await res.arrayBuffer()
	const wasmObj = await WebAssembly.instantiate(bytes, info)
  const exports = wasmObj.instance.exports

	return {
    add: exports.add
  } as WasmFunctions
}
