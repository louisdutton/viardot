use super::liljencrants_fant;
use crate::noise::{gaussian, simplex};
use std::f64::consts::PI;

const PI2: f64 = PI * 2.0;
const ASPIRATION_BUFFER_SIZE: usize = 128;
const NOISE_SIMPLEX_AMPLITUDE: f64 = 0.25;
const NOISE_HANNING_FLOOR: f64 = 0.15;
const NOISE_HANNING_AMPLITUDE: f64 = 0.8;

struct Oscillation {
    /// frequency in hertz
    frequency: f64,

    /// amplitude in range 0..1
    amplitude: f64,
}

pub struct Glottis {
    pub frequency: f64,
    pub tenseness: f64,
    vibrato: Oscillation,
    intensity: f64,
    loudness: f64,
    wave_function: Box<dyn Fn(f64) -> f64 + Send>,
    aspiration_buffer: [f64; ASPIRATION_BUFFER_SIZE],
    aspiration_index: usize,
}

impl Glottis {
    pub fn new() -> Glottis {
        let tenseness = 0.5;
        let vibrato = Oscillation {
            frequency: 6.0,
            amplitude: 0.1,
        };

        Glottis {
            tenseness,
            vibrato,
            frequency: 440.0, // A4
            intensity: 0.5,
            loudness: 0.1,
            wave_function: Box::new(liljencrants_fant(tenseness)),
            aspiration_buffer: [gaussian(); ASPIRATION_BUFFER_SIZE],
            aspiration_index: 0,
        }
    }

    pub fn pre_block(&mut self) {
        self.wave_function = Box::new(liljencrants_fant(self.tenseness));
        // let simplex1 = simplex(1.4);
        // let simplex2 = simplex(4.2);
    }

    // pub fn post_block() {}

    /// Generates glottal excitation at a given time.
    pub fn tick(&mut self, time: f64) -> f64 {
        // TODO: add noise back in
        // let s1 = simplex1[n] as f64;
        // let s2 = simplex2[n] as f64;
        let s1 = simplex(self.aspiration_index as f64 * 2.0);
        let s2 = simplex(self.aspiration_index as f64);

        // vibrato
        let mut vibrato = (self.vibrato.frequency * PI2 * time).sin() * self.vibrato.amplitude;
        vibrato += (s1 * self.vibrato.amplitude / 2.0) + (s2 * self.vibrato.amplitude / 3.0);

        // excitation
        let f0 = self.frequency + vibrato;
        let t = (time * f0) % 1.0;
        let excitation = (self.wave_function)(t);

        // aspiration (gaussian buffer = aspiration)
        let aspiration = self.aspiration_buffer[self.aspiration_index];
        let modulation = hanning_modulation(t, NOISE_HANNING_FLOOR, NOISE_HANNING_AMPLITUDE);
        let noise_residual =
            aspiration * (1.0 + s2 * NOISE_SIMPLEX_AMPLITUDE) * modulation * self.tenseness.sqrt();
        self.aspiration_index = (self.aspiration_index + 1) % ASPIRATION_BUFFER_SIZE; // saturated incremement

        return (excitation) * self.intensity * self.loudness + noise_residual;
    }
}

/// Returns a hanning-window amplitude modulation value at point t for a given frequency.
fn hanning_modulation(t: f64, floor: f64, amplitude: f64) -> f64 {
    floor + amplitude * ((1.0 - (PI2 * t).cos()) / 2.0)
}
