pub mod consts;
pub mod noise;
use crate::utils::consts::{PI, PI2};
use rand;

pub fn sine_wave(frequency: f64) -> impl Fn(f64) -> f64 {
  move |t| (t * frequency * 2.0 * PI).sin()
}

pub fn gaussian() -> f64 {
  rand::random::<f64>()
}

/// Returns a hanning-window amplitude modulation value at point t for a given frequency.
pub fn hanning_modulation(t: f64, frequency: f64, floor: f64, amplitude: f64) -> f64 {
  floor + amplitude * hanning(t, frequency)
}

fn hanning(t: f64, frequency: f64) -> f64 {
  (1.0 - (PI2 * t * frequency).cos()) / 2.0
}

pub fn set_panic_hook() {
  // When the `console_error_panic_hook` feature is enabled, we can call the
  // `set_panic_hook` function at least once during initialization, and then
  // we will get better error messages if our code ever panics.
  //
  // For more details see
  // https://github.com/rustwasm/console_error_panic_hook#readme
  #[cfg(feature = "console_error_panic_hook")]
  console_error_panic_hook::set_once();
}
