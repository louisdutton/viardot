import { Fach } from '.';
import { Voice } from '.';
declare type Fachs = [Fach, Fach, Fach, Fach];
/**
 * Collection of 4 voices
 */
export declare class Quartet {
    voices: Voice[];
    constructor(fachs: Fachs);
}
export {};
