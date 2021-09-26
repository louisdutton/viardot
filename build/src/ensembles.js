import { Voice } from '.';
/**
 * Collection of 4 voices
 */
export class Quartet {
    constructor(fachs) {
        this.voices = fachs.map(f => new Voice(f));
    }
}
