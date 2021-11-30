pub mod consts;
pub mod noise;
use crate::utils::consts::{PI, PI2};

pub fn sine_wave(frequency: f32) -> impl Fn(f32) -> f32 {
  move |t| (t * frequency * 2.0 * PI).sin()
}

pub fn gaussian() -> f32 {
  rand::random::<f32>()
}

/// Returns a hanning-window amplitude modulation value at point t for a given frequency.
pub fn hanning_modulation(t: f32, frequency: f32, floor: f32, amplitude: f32) -> f32 {
  floor + amplitude * hanning(t, frequency)
}

fn hanning(t: f32, frequency: f32) -> f32 {
  (1.0 - (PI2 * t * frequency).cos()) / 2.0
}
