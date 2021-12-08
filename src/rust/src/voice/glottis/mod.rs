#![allow(dead_code)]
use crate::utils;

use crate::waveform;
use utils::consts::PI2;
use utils::hanning_modulation;
use utils::noise;

use crate::waveform::liljencrants_fant;

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
  sample_rate: usize,
  block_size: usize,
}

impl Glottis {
  pub fn new(sample_rate: usize, block_size: usize) -> Glottis {
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
      sample_rate,
      block_size,
    }
  }

  /// Generates glottal excitation at a given time.
  pub fn process(&self, time: f64) -> Vec<f64> {
    let mut output = Vec::with_capacity(128);
    // TODO: cache this so it doesnt need to be recalculated for the same tenseness value.
    let wave_function = liljencrants_fant(self.tenseness);

    // TODO: add noise back in
    // let noise = waveform::noise();
    // let simplex1 = noise::simplex(1.4);
    // let simplex2 = noise::simplex(4.2);
    // let aspiration = noise::gaussian_buffer(128);
    let aspiration = [0.0; 128];

    for n in 0..128 {
      // simplex noise
      // let s1 = simplex1[n] as f64;
      // let s2 = simplex2[n] as f64;
      let s1 = 0.0;
      let s2 = 0.0;
      // vibrato
      let mut vibrato = (self.vibrato.frequency * PI2 * time).sin() * self.vibrato.amplitude;
      vibrato += (s1 * self.vibrato.amplitude / 2.0) + (s2 * self.vibrato.amplitude / 3.0);

      // excitation
      let f0 = self.frequency + vibrato;
      let t = (n as f64 / self.sample_rate as f64) % 1.0;
      let excitation = wave_function(t);

      // aspiration (gaussian buffer = aspiration)
      let modulation = hanning_modulation(t, f0, 0.15, 0.2);
      let noise_residual = aspiration[n] * (1.0 + s2 * 0.25) * modulation * self.tenseness.sqrt();

      let sample = (excitation + noise_residual) * self.intensity * self.loudness;
      output.push(sample);
    }

    output
  }
}

// Creates an waveform model glottal function based on tenseness variable
// pub fn create_lf_wave_function<'a>(tenseness: &'a f64) -> Box<dyn Fn(f64) -> f64 + 'a> {
//   Box::new(move |t| {
//     if t > te {
//       -((-epsilon * (t - te).exp()) + shift) / delta
//     } else {
//       e0 * (alpha * t).exp() * (omega * t).sin()
//     }
//   })
// }