mod glottis;
mod tract;

use glottis::Glottis;
use tract::Tract;
use wasm_bindgen::prelude::*;

/// The vocal synthesis module.
#[wasm_bindgen]
pub struct Voice {
  glottis: Glottis,
  tract: Tract,
}

#[wasm_bindgen]
impl Voice {
  pub fn new(sample_rate: usize, block_size: usize) -> Voice {
    // Create vocal tract
    let tract = Tract::new();
    let glottis = Glottis::new();

    Voice { glottis, tract }
  }

  fn process(&mut self, block: [f32; 128]) -> [f32; 128] {
    // create output buffer
    let mut out = [0.0; 128];
    let noise = [0.0; 128]; // TODO actually generate noise

    // Generate glottal source wave
    out = self.glottis.generate();
    // Filter source via the vocal stract
    // out = self.tract.process(out, noise);

    return out;
  }
}
