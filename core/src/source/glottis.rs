use super::{liljencrants_fant, white_noise};
use std::f64::consts::PI;
const PI2: f64 = PI * 2.0;

struct Vibrato {
    frequency: f64,
    amplitude: f64,
}

pub struct Glottis {
    pub frequency: f64,
    vibrato: Vibrato,
    intensity: f64,
    tenseness: f64,
    loudness: f64,
    wave_function: Box<dyn Fn(f64) -> f64 + Send>,
    aspiration_buffer: [f64; 128],
    aspiration_index: usize,
}

impl Glottis {
    pub fn new() -> Glottis {
        let vibrato: Vibrato = Vibrato {
            frequency: 6.0,
            amplitude: 4.0,
        };

        Glottis {
            frequency: 440.0, // A4
            vibrato,
            intensity: 0.5,
            tenseness: 0.0,
            loudness: 0.5,
            wave_function: Box::new(liljencrants_fant(0.0)),
            aspiration_buffer: create_aspiration_buffer(),
            aspiration_index: 0,
        }
    }

    pub fn pre_block(&mut self) {
        self.wave_function = Box::new(liljencrants_fant(self.tenseness));
        // let simplex1 = noise::simplex(1.4);
        // let simplex2 = noise::simplex(4.2);
    }

    // pub fn post_block() {}

    /// Generates glottal excitation at a given time.
    pub fn tick(&mut self, t: f64) -> f64 {
        // TODO: add noise back in
        // let s1 = simplex1[n] as f64;
        // let s2 = simplex2[n] as f64;
        let s1 = 0.0;
        let s2 = 0.0;
        // vibrato
        let mut vibrato = (self.vibrato.frequency * PI2 * t).sin() * self.vibrato.amplitude;
        vibrato += (s1 * self.vibrato.amplitude / 2.0) + (s2 * self.vibrato.amplitude / 3.0);

        // excitation
        let f0 = self.frequency + vibrato;
        // let t = (n as f64 / self.sample_rate as f64) % 1.0;
        let excitation = (self.wave_function)(t);

        // aspiration (gaussian buffer = aspiration)
        let aspiration = self.aspiration_buffer[self.aspiration_index];
        let modulation = hanning_modulation(t, f0, 0.15, 0.2);
        let noise_residual = aspiration * (1.0 + s2 * 0.25) * modulation * self.tenseness.sqrt();
        self.aspiration_index = (self.aspiration_index + 1) % 128; // incremement & wrap within 128

        return (excitation + noise_residual) * self.intensity * self.loudness;
    }
}

// Creates an waveform model glottal function based on tenseness variable
fn create_lf_wave_function<'a>(tenseness: &'a f64) -> Box<dyn Fn(f64) -> f64 + 'a> {
    // convert tenseness to rd variable
    let rd = 0.5 + 2.2 * (1.0 - tenseness); // must be in range: [.5, 2.7]

    // normalized to time = 1, Ee = 1
    let ra = -0.01 + 0.048 * rd;
    let rk = 0.224 + 0.118 * rd;
    let rg = (rk / 4.0) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk));

    // Timing parameters
    let ta = ra;
    let tp = 1.0 / (2.0 * rg); // instant of maximum glottal flow
    let te = tp + tp * rk;

    let epsilon = 1.0 / ta;
    let shift = (-epsilon * (1.0 - te)).exp();
    let delta = 1.0 - shift; // divide by this to scale RHS

    let rhs_integral = ((1.0 / epsilon) * (shift - 1.0) + (1.0 - te) * shift) / delta;

    let total_lower_integral = -(te - tp) / 2.0 + rhs_integral;
    let total_upper_integral = -total_lower_integral;

    let omega = PI / tp;
    let sine = (omega * te).sin();

    let y = -PI * sine * total_upper_integral / (tp * 2.0);
    let z = y.ln();
    let alpha = z / (tp / 2.0 - te);
    let e0 = -1.0 / (sine * (alpha * te).exp());

    Box::new(move |t| {
        if t > te {
            -((-epsilon * (t - te).exp()) + shift) / delta
        } else {
            e0 * (alpha * t).exp() * (omega * t).sin()
        }
    })
}

/// Returns a hanning-window amplitude modulation value at point t for a given frequency.
fn hanning_modulation(t: f64, frequency: f64, floor: f64, amplitude: f64) -> f64 {
    floor + amplitude * hanning(t, frequency)
}

fn hanning(t: f64, frequency: f64) -> f64 {
    (1.0 - (PI2 * t * frequency).cos()) / 2.0
}

fn create_aspiration_buffer() -> [f64; 128] {
    let noise = white_noise();
    return [noise(0.0); 128];
}
