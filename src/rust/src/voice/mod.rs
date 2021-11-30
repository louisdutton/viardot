//! The vocal synthesis module.

#![allow(dead_code)]
mod glottis;
mod tract;

use glottis::Glottis;
use tract::Tract;

pub struct Voice {
  glottis: Glottis,
  tract: Tract,
}

impl Voice {
  pub fn new(sample_rate: usize, block_size: usize) -> Voice {
    // Create vocal tract
    let tract = Tract::new();
    let glottis = Glottis::new();

    Voice { glottis, tract }
  }

  fn process(&mut self) -> [f32; 128] {
    // create output buffer
    let mut out = self.glottis.process();
    let noise = [0.0; 128]; // TODO actually generate noise
    // Filter source via the vocal stract
    // out = self.tract.process(&out, &noise);

    return out;
  }
}
