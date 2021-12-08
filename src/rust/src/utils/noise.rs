use crate::utils::gaussian;

// Noise buffers
// pub fn simplex(frequency: f32) -> Vec<f32> {
//   NoiseBuilder::fbm_1d(128)
//     .with_freq(frequency)
//     .generate_scaled(-1.0, 1.0)
// }

pub fn gaussian_buffer(size: usize) -> Vec<f64> {
  let mut samples: Vec<f64> = Vec::with_capacity(size);
  samples.fill_with(gaussian);
  // for _n in 0..size {
  //   samples.push(gaussian());
  // }
  samples
}