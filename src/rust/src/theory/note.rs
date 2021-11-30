const a4: f32 = 440.0;

/// Calculates the frequency (equal-tempered) given A4, the semitone and the octave.
///
/// A4 = `note(9u, 4u)` =
pub fn note(index: usize, octave: usize) -> f32 {
  let semitones_from_a4 = octave as isize * 12 + index as isize - 9 - 48;
  440.0 * (semitones_from_a4 as f32 * 2.0.ln() / 12.0).exp()
}

/// Calculates the frequency (equal-tempered) given A4 and the MIDI note value.
///
/// C4 = `note_midi(60u)`
/// A4 = `note_midi(69u)`
pub fn midi_to_freq(midi_note: usize) -> f32 {
  let semitone = midi_note % 12;
  let octave = (midi_note / 12) - 1;
  note(semitone, octave)
}
