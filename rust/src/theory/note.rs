/// Standard tuning for note: A4.
const A4: f64 = 440.0;

/// A musical pitch composed of chromatic index and octave.
struct Note {
  /// The chromatic index within the octave [0-11].
  chroma: usize,
  /// The note's octave [0-8].
  octave: usize,
}

impl Note {
  /// Calculates the frequency of a given note.
  ///
  /// ```
  /// let note = Note::new(9, 4); // A4
  /// let freq: f64 = note.to_freq(); // 440.0hz
  /// ```
  pub fn to_freq(self) -> f64 {
    note_to_freq(self.chroma, self.octave)
  }
}

/// Calculates the frequency from the chromatic index and the octave.
///
/// ```
/// let freq: f64 = note_to_freq(9, 4); // 440.0hz
/// ```
fn note_to_freq(chroma: usize, octave: usize) -> f64 {
  let semitones_from_a4 = octave as isize * 12 + chroma as isize - 9 - 48;
  A4 * (semitones_from_a4 as f64 * 2.0f64.ln() / 12.0).exp()
}

/// Calculates the frequency (equal-tempered) given A4 and the MIDI note value.
///
/// ```
/// let freq: f64 = midi_to_freq(69); // 440.0hz
/// ```
pub fn midi_to_freq(midi_pitch: usize) -> f64 {
  let chroma = midi_pitch % 12;
  let octave = (midi_pitch / 12) - 1;
  note_to_freq(chroma, octave)
}
