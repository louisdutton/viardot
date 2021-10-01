export class Random {
  /** Returns a random number between 0 and 1 (exclusive). */
  static value = Math.random

  /** Returns a random number between a and b. */
  static range (a: number, b: number) {
    return a + (b-a) * this.value()
  } 

  /** Returns a zero-mean normal-distributed number [-1, 1]. */
  static gaussian() {
    var u = 0, v = 0;
    while(u === 0) u = this.value() //Converting [0,1) to (0,1)
    while(v === 0) v = this.value()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

/** Basic envelope. */
export class ADSR {
  public attack: number
  public decay: number
  public sustain: number
  public release: number

  constructor(attack: number, decay: number, sustain: number, release: number) {
    this.attack = attack
    this.decay = decay
    this.sustain = sustain
    this.release = release
  }
}

/** Returns a number whose value is limited to the given range.*/
export function clamp (value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
};