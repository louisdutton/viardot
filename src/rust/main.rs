// TODO Get the glottal and tract processor running in pure Rust. Then work on the WASM.

struct Cavity {
  k: [f32; BUCCAL_LENGTH],
  left: [f32; BUCCAL_LENGTH],
  right: [f32; BUCCAL_LENGTH],
  junction_left: [f32; BUCCAL_LENGTH],
  junction_right: [f32; BUCCAL_LENGTH],
}

fn main() {
  println!("hello");
}

/// Returns the circular cross-sectional area for a given diameter.
fn circleArea(diameter: f32) -> f32 {
  diameter * diameter / 4 * std::f32::consts::PI;
}

/// Returns the coefficient of reflection between two cross-sectional areas.
fn kellyLochbaum(A1: f32, A2: f32) -> f32 {
  (A1 - A2) / (A1 + A2);
}

/// Returns an eased value in range [0-1].
fn ease(x: f32) -> f32 {
  if x == 0 {0} else {f32::powf(2, 10 * x - 10)};
}

/// Coefficient of reflection at the glottis.
const K_GLOTTAL: f32 = 0.7;

/// Coefficient of reflection at the labia.
const K_LABIAL: f32 = -0.85;

/// Coefficient of reflection at the nose.
const K_NASAL: f32 = -0.9;

/// Left-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_LEFT: f32 = 0;

/// Right-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_RIGHT: f32 = 0;

/// Number of segments in the buccal cavity.
const BUCCAL_LENGTH: usize = 44;

/// Number of segments in the nasal cavity.
const NASAL_LENGTH: usize = 28;

/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: u8 = 17;

/// The coefficient of sound absorption.
const ATTENUATION: f32 = 0.9999;

static mut buccal: Cavity = Cavity {
  k: [0; BUCCAL_LENGTH],
  left: [0; BUCCAL_LENGTH],
  right: [0; BUCCAL_LENGTH],
  junction_left: [0; BUCCAL_LENGTH],
  junction_right: [0; BUCCAL_LENGTH],
};

static mut nasal: Cavity = Cavity {
  k: [0; NASAL_LENGTH],
  left: [0; NASAL_LENGTH],
  right: [0; NASAL_LENGTH],
  junction_left: [0; NASAL_LENGTH],
  junction_right: [0; NASAL_LENGTH],
};


// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
// fn step(excitation: f32, noise: f32) {
//   // Calculate reflections in the buccal cavity.

//   // Glottal excitation enters left and labial reflection enters right
//   junctionR[0] = L[0] * glottalK + excitation;
//   junctionL[BUCCAL_LENGTH] = R[BUCCAL_LENGTH - 1] * labialK;

//   // reflection {w} at each junction
//   for (int m = 1; m < BUCCAL_LENGTH; m++)
//   {
//     float w = K[m] * (R[m - 1] + L[m]); // reflection
//     junctionR[m] = R[m - 1] - w;
//     junctionL[m] = L[m] + w;
//   }

//   // Calculate reflections at the velopharyngeal junction
//   int v = velumIndex;
//   junctionL[v] = velumKL * R[v - 1] + (1 + velumKL) * (nasalL[0] + L[v]);
//   junctionR[v] = velumKR * L[v] + (1 + velumKR) * (R[v - 1] + nasalL[0]);
//   nasalJunctionR[0] = nasalK * nasalL[0] + (1 + nasalK) * (L[v] + R[v - 1]);

//    // Transfer attenuated energy to 
//   for (int m = 0; m < BUCCAL_LENGTH; m++) {
//       R[m] = junctionR[m] * attenuation;
//       L[m] = junctionL[m+1] * attenuation;
//   }
// }

// float *process(float excitationSamples[], float noiseSamples[], int blockSize)
// {
//   float output[blockSize];
//   for (int n = 0; n < blockSize; n++)
//   {
//     const float excitation = excitationSamples[n];
//     const float noise = noiseSamples[n];

//     // run step twice per sample
//     step(excitation, noise);
//     step(excitation, noise);

//     // output[n] = labialOutput + nasalOutput;
//   }
//   return output;
// }

// float TractStep(float excitation, float noise) {
//

//

//   // now at junction with nose (velum)
//

//   // Nose
//   noseJunctionOutputL[noseLength] = noseR[noseLength-1] * labialReflectionCoefficient

//   for (let v = 1; v < noseLength; v++) {
//       const w = noseK[v] * (noseR[v-1] + noseL[v])
//       noseJunctionOutputR[v] = noseR[v-1] - w
//       noseJunctionOutputL[v] = noseL[v] + w
//   }

//   // decay in nasal cavity
//   for (int v = 0; v < noseLength; v++) {
//       noseR[v] = noseJunctionOutputR[v] * decay;
//       noseL[v] = noseJunctionOutputL[v+1] * decay;
//   }
// }
