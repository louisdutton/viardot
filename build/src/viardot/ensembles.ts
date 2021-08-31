import { Fach } from '.'
import { Voice } from '.'

type Fachs = [Fach, Fach, Fach, Fach]
/**
 * Collection of 4 voices
 */
export class Quartet {
  voices: Voice[]

  constructor(fachs: Fachs) {
    this.voices = fachs.map(f => new Voice(f))
  }
}