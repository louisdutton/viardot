use core::source::Glottis;
use rodio::{OutputStream, Source};
use std::thread::sleep;
use std::time::Duration;

struct Voice {
    sample_rate: u32,
    samples: [f32; 256],
    glottis: Glottis,
}

impl Iterator for Voice {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        return None;
    }
}

impl Source for Voice {
    fn current_frame_len(&self) -> Option<usize> {
        return None;
    }

    fn channels(&self) -> u16 {
        return 1;
    }

    fn sample_rate(&self) -> u32 {
        return self.sample_rate;
    }

    fn total_duration(&self) -> Option<Duration> {
        return None;
    }
}

impl Voice {
    pub fn new(sample_rate: u32) -> Voice {
        let glottis = Glottis::new();
        let samples = [0.0; 256];
        for n in 0..256 {
            samples[n] = glottis.tick(n / sample_rate)
        }

        Voice {
            sample_rate,
            samples,
            glottis,
        }
    }

    pub fn tick(&mut self) -> f32 {
        return self.glottis.tick(0.0) as f32;
    }
}

fn main() {
    let voice = Voice::new(44100);

    let (_stream, handle) = OutputStream::try_default().unwrap();
    let _result = handle.play_raw(voice.convert_samples());

    sleep(Duration::from_secs(1))
}
