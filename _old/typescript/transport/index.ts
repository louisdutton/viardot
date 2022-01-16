export default class Transport {
  public metre: number
  public tempo: number

  constructor(metre = 4, tempo = 100) {
    this.metre = metre
    this.tempo = tempo
  }
}