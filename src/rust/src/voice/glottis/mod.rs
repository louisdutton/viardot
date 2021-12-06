#![allow(dead_code)]
use crate::utils;

use utils::consts::{PI, PI2};
use utils::hanning_modulation;
use utils::noise;

struct Vibrato {
  frequency: f32,
  amplitude: f32,
}

pub struct Glottis {
  pub frequency: f32,
  vibrato: Vibrato,
  intensity: f32,
  tenseness: f32,
  loudness: f32,
}

impl Glottis {
  pub fn new() -> Glottis {
    let vibrato: Vibrato = Vibrato {
      frequency: 6.0,
      amplitude: 4.0,
    };

    Glottis {
      frequency: 444.0, // A4
      vibrato,
      intensity: 0.5,
      tenseness: 0.0,
      loudness: 0.5,
    }
  }

  pub fn process(&self) -> [f32; 128] {
    let mut output = [0.0; 128];
    // TODO: cache this so it doesnt need to be recalculated for the same tenseness value.
    let wave_function = create_lf_wave_function(&0.0);

    // debug values
    let time = 0.0;
    let sample_rate = 44100.0;
    let simplex1 = noise::simplex(1.4);
    let simplex2 = noise::simplex(4.2);
    // let aspiration = noise::gaussian_buffer(128);
    let aspiration = [0.0; 128];

    for n in 0..128 {
      // simplex noise
      let s1 = simplex1[n];
      let s2 = simplex2[n];
      // vibrato
      let mut vibrato = (self.vibrato.frequency * PI2 * time).sin() * self.vibrato.amplitude;
      vibrato += (s1 * self.vibrato.amplitude / 2.0) + (s2 * self.vibrato.amplitude / 3.0);

      // excitation
      let f0 = self.frequency + vibrato;
      let t = n as f32 / sample_rate as f32;
      let excitation = wave_function(t);

      // aspiration (gaussian buffer = aspiration)
      let modulation = hanning_modulation(t, f0, 0.15, 0.2);
      let noise_residual = aspiration[n] * (1.0 + s2 * 0.25) * modulation * self.tenseness.sqrt();

      output[n] = (excitation + noise_residual) * self.intensity * self.loudness;
    }

    output
  }
}

/// Creates an waveform model glottal function based on tenseness variable
pub fn create_lf_wave_function<'a>(tenseness: &'a f32) -> Box<dyn Fn(f32) -> f32 + 'a> {
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
  let shift = (-epsilon * (1.0 - te)).exp(); // exp(-epsilon * (1-te));
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

  // return glottal waveform function
  Box::new(move |t| {
    if t > te {
      -((-epsilon * (t - te).exp()) + shift) / delta
    } else {
      e0 * (alpha * t).exp() * (omega * t).sin()
    }
  })
}
