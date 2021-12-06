//! The vocal synthesis module.

pub mod glottis;
pub mod tract;

use self::glottis::Glottis;
use self::tract::Tract;

pub struct Voice {
  glottis: Glottis,
  tract: Tract,
}

impl Voice {
  pub fn new(sample_rate: usize, block_size: usize) -> Voice {
    Voice {
      glottis: Glottis::new(),
      tract: Tract::new(),
    }
  }

  pub fn process(&mut self) -> [f64; 128] {
    // create output buffer
    let out = self.glottis.process();
    // let noise = [0.0; 128]; // TODO actually generate noise
    // Filter source via the vocal stract
    // out = self.tract.process(&out, &noise);

    return out;
  }
}
