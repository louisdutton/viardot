use core::source::Glottis;
use rodio::{OutputStream, Source};
use std::thread::sleep;
use std::time::Duration;

// mod stream;

struct Voice {
    i: usize,
    sample_rate: usize,
    glottis: Glottis,
}

impl Iterator for Voice {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let t = self.i as f64 / self.sample_rate as f64;
        self.i += 1;
        return Some(self.glottis.tick(t) as f32);
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
        }
    }

    pub fn set_frequency(&mut self, value: f64) {
        self.glottis.frequency = value;
    }
}

fn main() {
    let mut voice = Voice::new(44100);
    voice.set_frequency(440.0);

    let (_stream, handle) = OutputStream::try_default().unwrap();
    let _result = handle.play_raw(voice.convert_samples().fade_in(Duration::from_millis(400)));

    sleep(Duration::from_millis(2000));
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
