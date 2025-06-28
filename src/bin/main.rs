use rodio::{OutputStream, Source};
use std::thread::sleep;
use std::time::Duration;
use viardot::filter::stateful::tract::Tract;
use viardot::source::Glottis;

// mod stream;
struct Voice {
    i: usize,
    sample_rate: usize,
    glottis: Glottis,
    tract: Tract,
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
    pub fn new(sample_rate: usize) -> Voice {
        Voice {
            i: 0,
            sample_rate,
            glottis: Glottis::new(),
            tract: Tract::new(46, 32),
        }
    }

    fn generate(&mut self, t: f64) -> f32 {
        let glottal_output = self.glottis.tick(t);
        let tract_output = self.tract.process(glottal_output, 0.0);
        return tract_output as f32;
    }

    pub fn set_frequency(&mut self, value: f64) {
        self.glottis.frequency = value;
    }
}

fn main() {
    let mut voice = Voice::new(44100);
    voice.set_frequency(220.0);

    let (_stream, handle) = OutputStream::try_default().unwrap();
    let _result = handle.play_raw(voice.convert_samples().fade_in(Duration::from_millis(100)));

    sleep(Duration::from_secs(3));
}

mod tests {
    #[allow(unused_imports)]
    use super::*;

    #[test]
    // #[allow(clippy::float_cmp)]
    fn test_iterator() {
        let mut voice = Voice::new(44100);

        for n in 0..256 {
            let next = voice.next();
            println!("{:?}", next);
            // assert_eq!(next, Some(0.0));
        }
    }
}
