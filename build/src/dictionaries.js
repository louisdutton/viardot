/**
 * Phoneme -> tongue position dictionary
 */
export const PhonemeToTonguePosition = {
    // vowels
    'aa': [.2, .2],
    'ah': [.5, .333],
    'ae': [.25, .25],
    'uh': [.75, .75],
    'ao': [1, .8],
    'ax': [.95, .95],
    'oh': [5.7, 2],
    'uw': [.95, .95],
    'ih': [24.8, 2.6],
    'iy': [.75, .2],
    // fricatives
    'sh': [33.98, 0.5],
    'zh': [34.7, 0.65],
    's': [37.8, 0.5],
    'z': [38, 0.75],
    'f': [41.0, 0.6],
    'v': [41.0, 0.6],
    // stops
    'g': [20.0, 0],
    'k': [25.0, 0],
    'd': [36.0, 0],
    't': [37.0, 0],
    'b': [41.0, 0],
    'p': [0.99, 0],
    // nasals
    'ng': [20.0, -1],
    'n': [36.0, -1],
    'm': [0.8, -1], // man
};
/**
 * Arpabet -> IPA phoneme dictionary
 */
export const ArpaToIPA = {
    'aa': 'ɑ',
    'ae': 'æ',
    'ah': 'ʌ',
    'ao': 'ɔ',
    'aw': 'aʊ',
    'ax': 'ə',
    'ay': 'aɪ',
    'eh': 'ɛ',
    'er': 'ɝ',
    'ey': 'eɪ',
    'ih': 'ɪ',
    'ix': 'ɨ',
    'iy': 'i',
    'ow': 'oʊ',
    'oy': 'ɔɪ',
    'uh': 'ʊ',
    'uw': 'u',
    'b': 'b',
    'ch': 'tʃ',
    'd': 'd',
    'dh': 'ð',
    'dx': 'ɾ',
    'el': 'l̩',
    'em': 'm̩',
    'en': 'n̩',
    'f': 'f',
    'g': 'ɡ',
    'hh': 'h',
    'jh': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'ng': 'ŋ',
    'p': 'p',
    'q': 'ʔ',
    'r': 'ɹ',
    's': 's',
    'sh': 'ʃ',
    't': 't',
    'th': 'θ',
    'v': 'v',
    'w': 'w',
    'wh': 'ʍ',
    'y': 'j',
    'z': 'z',
    'zh': 'ʒ',
};
