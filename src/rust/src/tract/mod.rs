// TODO Get the glottal and tract processor running in pure Rust. Then work on the WASM.
mod cavity;

use cavity::{NasalCavity, OralCavity, NASAL_LENGTH, ORAL_LENGTH};
use wasm_bindgen::prelude::*;
// use noise::{NoiseFn, OpenSimplex};

/// Returns the circular cross-sectional area for a given diameter.
fn circle_area(diameter: f32) -> f32 {
  return diameter * diameter / 4.0 * std::f32::consts::PI;
}

/// Returns the coefficient of reflection between two cross-sectional areas.
fn kelly_lochbaum(a: f32, b: f32) -> f32 {
  return (a - b) / (a + b);
}

/// Returns an eased value in range [0-1].
fn ease(x: f32) -> f32 {
  if x == 0.0 {
    return 0.0;
  } else {
    return f32::powf(2.0, 10.0 * x - 10.0);
  };
}

/// Coefficient of reflection at the glottis.
const K_GLOTTAL: f32 = 0.7;

/// Coefficient of reflection at the labia.
const K_LABIAL: f32 = -0.85;

/// Coefficient of reflection at the nasal.
const K_nasal: f32 = -0.9;

/// Left-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_LEFT: f32 = 0.0;

/// Right-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_RIGHT: f32 = 0.0;

/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: usize = 17;

/// The coefficient of sound absorption.
const ATTENUATION: f32 = 0.9999;

// TODO: find an alternative to static mut for handling cavity mutation
/// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
unsafe fn step(excitation: f32, noise: f32, oral: &OralCavity, nasal: &NasalCavity) {
  // TODO process turnbulance noise
  // let noise_output = noise

  // Calculate reflections in the buccal cavity.
  // Glottal excitation enters left and labial reflection enters right
  oral.junction_right[0] = oral.left[0] * K_GLOTTAL + excitation;
  oral.junction_left[ORAL_LENGTH] = oral.right[ORAL_LENGTH - 1] * K_LABIAL;

  // reflection {w} at each junction
  for m in 0..ORAL_LENGTH {
    let w = oral.k[m] * (oral.right[m - 1] + oral.left[m]); // reflection
    oral.junction_right[m] = oral.right[m - 1] - w;
    oral.junction_left[m] = oral.left[m] + w;
  }

  // Calculate reflections at the velopharyngeal junction
  oral.junction_left[VELUM_INDEX] = K_VELUM_LEFT * oral.right[VELUM_INDEX - 1]
    + (1.0 + K_VELUM_LEFT) * (nasal.left[0] + oral.left[VELUM_INDEX]);
  oral.junction_right[VELUM_INDEX] = K_VELUM_RIGHT * oral.left[VELUM_INDEX]
    + (1.0 + K_VELUM_RIGHT) * (oral.right[VELUM_INDEX - 1] + nasal.left[0]);
  nasal.junction_right[0] = K_nasal * nasal.left[0]
    + (1.0 + K_nasal) * (oral.left[VELUM_INDEX] + oral.right[VELUM_INDEX - 1]);

  // Transfer attenuated energy in oral cavity
  for m in 0..ORAL_LENGTH {
    oral.right[m] = oral.junction_right[m] * ATTENUATION;
    oral.left[m] = oral.junction_left[m + 1] * ATTENUATION;
  }

  // nasal
  nasal.junction_left[NASAL_LENGTH] = nasal.right[NASAL_LENGTH - 1] * K_LABIAL;

  for m in 1..NASAL_LENGTH {
    let w = nasal.k[m] * (nasal.right[m - 1] + nasal.left[m]);
    nasal.junction_right[m] = nasal.right[m - 1] - w;
    nasal.junction_left[m] = nasal.left[m] + w;
  }

  // decay in nasal cavity
  for m in 0..NASAL_LENGTH {
    nasal.right[m] = nasal.junction_right[m] * ATTENUATION;
    nasal.left[m] = nasal.junction_left[m + 1] * ATTENUATION;
  }
}

// FIXME Get the cavity mutation working!
const BLOCK_SIZE: usize = 128;
pub unsafe fn process(tract: &Tract, excitation: &[f32], noise: &[f32]) -> [f32; BLOCK_SIZE] {
  let mut output: [f32; BLOCK_SIZE] = [0.0; BLOCK_SIZE];
  let oral = &mut tract.oral;
  let nasal = &mut tract.nasal;
  for n in 0..tract.block_size {
    // run step twice per sample
    step(excitation[n], noise[n], oral, nasal);
    step(excitation[n], noise[n], oral, nasal);

    // sample output from the right-end of tract.
    output[n] = tract.oral.right[ORAL_LENGTH - 1] + tract.nasal.right[NASAL_LENGTH - 1];
  }
  return output;
}

#[wasm_bindgen]
pub struct Tract {
  sample_rate: usize,
  block_size: usize,
  oral: OralCavity,
  nasal: NasalCavity,
}

impl Tract {
  pub fn new(sample_rate: usize, block_size: usize) -> Tract {
    // Create cavities
    let mut nasal: NasalCavity = NasalCavity {
      k: [0.0; NASAL_LENGTH],
      left: [0.0; NASAL_LENGTH],
      right: [0.0; NASAL_LENGTH],
      junction_left: [0.0; NASAL_LENGTH + 1],
      junction_right: [0.0; NASAL_LENGTH + 1],
    };
    let mut oral: OralCavity = OralCavity {
      k: [0.0; ORAL_LENGTH],
      left: [0.0; ORAL_LENGTH],
      right: [0.0; ORAL_LENGTH],
      junction_left: [0.0; ORAL_LENGTH + 1],
      junction_right: [0.0; ORAL_LENGTH + 1],
    };

    Tract {
      sample_rate,
      block_size,
      oral,
      nasal,
    }
  }
}
