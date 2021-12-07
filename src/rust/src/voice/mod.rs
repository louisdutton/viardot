//! The vocal synthesis module.

pub mod glottis;
pub mod tract;

use self::glottis::Glottis;
use self::tract::Tract;
use crate::utils::set_panic_hook;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Voice {
  glottis: Glottis,
  tract: Tract,
  // sample_rate: usize,
  // block_size: usize,
}

#[wasm_bindgen]
impl Voice {
  pub fn new(sample_rate: usize, block_size: usize) -> Voice {
    set_panic_hook();
    Voice {
      glottis: Glottis::new(sample_rate, block_size),
      tract: Tract::new(sample_rate, block_size),
      // sample_rate,
      // block_size,
    }
  }

  pub fn process(&mut self, time: f64) -> Vec<f64> {
    // create output buffer
    // let noise = [0.0; 128]; // TODO actually generate noise
    let out = self.glottis.process(time);
    // Filter source via the vocal stract
    // out = self.tract.process(&out, &noise);

    return out;
  }
}
