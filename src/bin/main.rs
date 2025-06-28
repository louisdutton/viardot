use crossterm::{
    event::{poll, read, Event, KeyCode, KeyModifiers},
    terminal::{disable_raw_mode, enable_raw_mode},
};
use rodio::{OutputStream, Source};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use viardot::filter::reverb::Reverb;
use viardot::filter::stateful::tract::Tract;
use viardot::note::*;
use viardot::source::Glottis;

// mod stream;
struct Voice {
    i: usize,
    sample_rate: usize,
    glottis: Glottis,
    tract: Tract,
    reverb: Reverb,
    frequency: Arc<Mutex<f64>>,
}

impl Iterator for Voice {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let t = self.i as f64 / self.sample_rate as f64;
        self.i += 1;
        return Some(self.generate(t));
    }
}

impl Source for Voice {
    fn channels(&self) -> u16 {
        return 1;
    }

    fn sample_rate(&self) -> u32 {
        return self.sample_rate as u32;
    }

    fn total_duration(&self) -> Option<Duration> {
        return None;
    }

    fn current_frame_len(&self) -> Option<usize> {
        return None;
    }
}

impl Voice {
    pub fn new(sample_rate: usize, frequency: Arc<Mutex<f64>>) -> Voice {
        let mut reverb = Reverb::new(sample_rate);
        reverb.set_wet_level(0.9);

        Voice {
            i: 0,
            sample_rate,
            glottis: Glottis::new(),
            tract: Tract::new(46, 32),
            reverb,
            frequency,
        }
    }

    fn generate(&mut self, t: f64) -> f32 {
        if let Ok(freq) = self.frequency.lock() {
            self.glottis.frequency = *freq;
        }
        let glottal_output = self.glottis.process(t);
        let tract_output = self.tract.process(glottal_output, 0.0);
        let reverb_output = self.reverb.process(tract_output);
        return reverb_output as f32;
    }
}

fn main() {
    let frequency = Arc::new(Mutex::new(220.0)); // Start with A3
    let frequency_clone = Arc::clone(&frequency);

    let voice = Voice::new(44100, frequency_clone);

    let (_stream, handle) = OutputStream::try_default().unwrap();
    let _result = handle.play_raw(voice.convert_samples().fade_in(Duration::from_millis(100)));

    // Enable raw mode for immediate key capture
    enable_raw_mode().unwrap();

    loop {
        if poll(Duration::from_millis(50)).unwrap() {
            match read().unwrap() {
                Event::Key(key_event) => {
                    let note = match key_event.code {
                        // Lower row - base octave (C3, D3, etc.)
                        KeyCode::Char('a') => Some(C3),
                        KeyCode::Char('s') => Some(D3),
                        KeyCode::Char('d') => Some(E3),
                        KeyCode::Char('f') => Some(F3),
                        KeyCode::Char('g') => Some(G3),
                        KeyCode::Char('h') => Some(A3),
                        KeyCode::Char('j') => Some(B3),

                        // Upper row - one octave higher (C4, D4, etc.)
                        KeyCode::Char('q') => Some(C4),
                        KeyCode::Char('w') => Some(D4),
                        KeyCode::Char('e') => Some(E4),
                        KeyCode::Char('r') => Some(F4),
                        KeyCode::Char('t') => Some(G4),
                        KeyCode::Char('y') => Some(A4),
                        KeyCode::Char('u') => Some(B4),

                        // Number row - two octaves higher (C5, D5, etc.)
                        KeyCode::Char('1') => Some(C5),
                        KeyCode::Char('2') => Some(D5),
                        KeyCode::Char('3') => Some(E5),
                        KeyCode::Char('4') => Some(F5),
                        KeyCode::Char('5') => Some(G5),
                        KeyCode::Char('6') => Some(A5),
                        KeyCode::Char('7') => Some(B5),

                        KeyCode::Esc => break,
                        KeyCode::Char('c')
                            if key_event.modifiers.contains(KeyModifiers::CONTROL) =>
                        {
                            break
                        }
                        _ => None,
                    };

                    if let Some(note_freq) = note {
                        if let Ok(mut frequency_guard) = frequency.lock() {
                            *frequency_guard = note_freq;
                            println!("Playing: {:.2} Hz", note_freq);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    disable_raw_mode().unwrap();
}

mod tests {
    #[allow(unused_imports)]
    use super::*;

    #[test]
    // #[allow(clippy::float_cmp)]
    fn test_iterator() {
        let frequency = Arc::new(Mutex::new(440.0));
        let mut voice = Voice::new(44100, frequency);

        for n in 0..256 {
            let next = voice.next();
            println!("{:?}", next);
            // assert_eq!(next, Some(0.0));
        }
    }
}
