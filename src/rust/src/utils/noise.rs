use crate::utils::gaussian;
use simdnoise::NoiseBuilder;

// Noise parameters
const floor: f32 = 0.15;
const amplitude: f32 = 0.2;

// Noise buffers
pub fn simplex(frequency: f32) -> Vec<f32> {
  NoiseBuilder::fbm_1d(128)
    .with_freq(frequency)
    .generate_scaled(-1.0, 1.0)
}

pub fn gaussian_buffer(size: usize) -> Vec<f32> {
  let mut samples: Vec<f32> = Vec::with_capacity(size);
  samples.fill_with(gaussian);
  // for _n in 0..size {
  //   samples.push(gaussian());
  // }
  samples
}
