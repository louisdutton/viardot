import { FACH } from '.'
import { Voice } from '.'

/**
 * Collection of 4 voices
 */
 export class Quartet {
  voices: Voice[]

  constructor() {
    this.voices = [
      new Voice(FACH.SOPRANO),
      new Voice(FACH.MEZZO),
      new Voice(FACH.TENOR),
      new Voice(FACH.BASS),
    ]
  }
}