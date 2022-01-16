import Context from "./context"
import Worklet from "./worklet"

/** Viardot's global context. */
export const context = new Context()

/** Handles the javascript running from the AudioWorklet global scope. */
export const worklet = new Worklet()

/** Initalizes Viardot. Must be called before anything else. */
export const start = context.resume

/** Returns the current time within the audio context */
export const now = context.now

/** Sets the global reverb settings. */
export const setReverb = context.setReverb
