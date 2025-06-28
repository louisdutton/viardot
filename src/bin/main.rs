use crossterm::{
    event::{poll, read, Event, KeyCode, KeyModifiers},
    terminal::{disable_raw_mode, enable_raw_mode},
};
use rodio::{OutputStream, Source};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use viardot::filter::stateful::tract::Tract;
use viardot::source::Glottis;

// mod stream;
struct Voice {
    i: usize,
    sample_rate: usize,
    glottis: Glottis,
    tract: Tract,
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
        Voice {
            i: 0,
            sample_rate,
            glottis: Glottis::new(),
            tract: Tract::new(46, 32),
            frequency,
        }
    }

    fn generate(&mut self, t: f64) -> f32 {
        if let Ok(freq) = self.frequency.lock() {
            self.glottis.frequency = *freq;
        }
        let glottal_output = self.glottis.tick(t);
        let tract_output = self.tract.process(glottal_output, 0.0);
        return tract_output as f32;
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

    println!("Keyboard Controls:");
    println!("Q/W/E/R/T/Y/U - Play notes (C/D/E/F/G/A/B)");
    println!("A/S/D/F/G/H/J - Play notes one octave higher");
    println!("Z/X - Lower/raise octave");
    println!("ESC or Ctrl+C - Exit");

    let mut current_octave = 3;

    loop {
        if poll(Duration::from_millis(50)).unwrap() {
            match read().unwrap() {
                Event::Key(key_event) => {
                    let base_freq = match key_event.code {
                        // Lower row - base octave
                        KeyCode::Char('q') => Some(261.63), // C
                        KeyCode::Char('w') => Some(293.66), // D
                        KeyCode::Char('e') => Some(329.63), // E
                        KeyCode::Char('r') => Some(349.23), // F
                        KeyCode::Char('t') => Some(392.00), // G
                        KeyCode::Char('y') => Some(440.00), // A
                        KeyCode::Char('u') => Some(493.88), // B

                        // Upper row - one octave higher
                        KeyCode::Char('a') => Some(261.63 * 2.0), // C
                        KeyCode::Char('s') => Some(293.66 * 2.0), // D
                        KeyCode::Char('d') => Some(329.63 * 2.0), // E
                        KeyCode::Char('f') => Some(349.23 * 2.0), // F
                        KeyCode::Char('g') => Some(392.00 * 2.0), // G
                        KeyCode::Char('h') => Some(440.00 * 2.0), // A
                        KeyCode::Char('j') => Some(493.88 * 2.0), // B

                        // Octave controls
                        KeyCode::Char('z') => {
                            current_octave = (current_octave - 1).max(1);
                            println!("Octave: {}", current_octave);
                            None
                        }
                        KeyCode::Char('x') => {
                            current_octave = (current_octave + 1).min(7);
                            println!("Octave: {}", current_octave);
                            None
                        }

                        KeyCode::Esc => break,
                        KeyCode::Char('c')
                            if key_event.modifiers.contains(KeyModifiers::CONTROL) =>
                        {
                            break
                        }
                        _ => None,
                    };

                    if let Some(freq) = base_freq {
                        let octave_multiplier = 2.0_f64.powi(current_octave - 4);
                        let final_freq = freq * octave_multiplier;

                        if let Ok(mut frequency_guard) = frequency.lock() {
                            *frequency_guard = final_freq;
                            println!("Playing: {:.2} Hz", final_freq);
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
