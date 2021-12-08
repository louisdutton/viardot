/** Phoneme -> tongue position dictionary */
export const Phonemes = {
  // vowels
  aa: [0.2, 0.2, 1], // part
  ah: [0.5, 0.4, 1], // pet
  ae: [0.25, 0.25], // pat ???????
  uh: [0.75, 0.75], // put
  ao: [0.85, 0.8, 0.9], // pot
  ax: [0.95, 0.95], // dial
  oh: [5.7, 2], // daughter
  uw: [1, 0.9, 0.2], // poot
  ih: [24.8, 2.6], // pit
  iy: [0.8, 0.2, 0.85], // peat

  // fricatives
  sh: [33.98, 0.5], // shell
  zh: [34.7, 0.65], // pleasure
  s: [37.8, 0.5], // soon
  z: [38, 0.75], // zoo
  f: [41.0, 0.6], // fair
  v: [41.0, 0.6], // very

  // stops
  g: [20.0, 0], // go
  k: [25.0, 0], // king
  d: [36.0, 0], // den
  t: [37.0, 0], // ten
  b: [41.0, 0], // bad
  p: [0.99, 0], // pad

  // nasals
  ng: [20.0, -1], // thing
  n: [36.0, -1], // not
  m: [0.8, -1], // man
};

/**
 * Arpabet -> IPA phoneme dictionary
 */
export const ArpaToIPA: { [key: string]: string } = {
  aa: "ɑ",
  ae: "æ",
  ah: "ʌ",
  ao: "ɔ",
  aw: "aʊ",
  ax: "ə",
  ay: "aɪ",
  eh: "ɛ",
  er: "ɝ",
  ey: "eɪ",
  ih: "ɪ",
  ix: "ɨ",
  iy: "i",
  ow: "oʊ",
  oy: "ɔɪ",
  uh: "ʊ",
  uw: "u",
  b: "b",
  ch: "tʃ",
  d: "d",
  dh: "ð",
  dx: "ɾ",
  el: "l̩",
  em: "m̩",
  en: "n̩",
  f: "f",
  g: "ɡ",
  hh: "h",
  jh: "dʒ",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  ng: "ŋ",
  p: "p",
  q: "ʔ",
  r: "ɹ",
  s: "s",
  sh: "ʃ",
  t: "t",
  th: "θ",
  v: "v",
  w: "w",
  wh: "ʍ",
  y: "j",
  z: "z",
  zh: "ʒ",
};
