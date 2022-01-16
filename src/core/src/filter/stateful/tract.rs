/// A line of sections through which sound can propagate.
pub struct Cavity {
    pub k: Vec<f64>,
    /// Left-moving components at section.
    pub left: Vec<f64>,
    /// Right-moving components at section.
    pub right: Vec<f64>,
    /// Left-moving components at junction.
    pub j_left: Vec<f64>,
    /// Right-moving components at junction.
    pub j_right: Vec<f64>,
}

impl Cavity {
    pub fn new(N: usize) -> Cavity {
        Cavity {
            k: Vec::with_capacity(N),
            left: Vec::with_capacity(N),
            right: Vec::with_capacity(N),
            j_left: Vec::with_capacity(N + 1),
            j_right: Vec::with_capacity(N + 1),
        }
    }
}

/// Returns the circular cross-sectional area for a given diameter.
fn circle_area(diameter: f64) -> f64 {
    return diameter * diameter / 4.0 * std::f64::consts::PI;
}

/// Returns the coefficient of reflection between two cross-sectional areas.
fn kelly_lochbaum(a1: f64, a2: f64) -> f64 {
    return (a1 - a2) / (a1 + a2);
}

/// Returns an eased value in range [0-1].
fn ease(x: f64) -> f64 {
    if x == 0.0 {
        return 0.0;
    } else {
        return f64::powf(2.0, 10.0 * x - 10.0);
    }
}

/// Number of sections in the oral cavity.
const ORAL_LENGTH: usize = 44;

/// Number of sections in the oral cavity.
const NASAL_LENGTH: usize = 28;

/// Coefficient of reflection at the glottis.
const K_GLOTTAL: f64 = 0.7;

/// Coefficient of reflection at the labia.
const K_LABIAL: f64 = -0.85;

/// Coefficient of reflection at the nasal.
const K_NOSE: f64 = -0.9;

/// Left-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_LEFT: f64 = 0.0;

/// Right-moving coefficient of reflection at the nasopharyngeal junction.
const K_VELUM_RIGHT: f64 = 0.0;

/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: usize = 17;

/// The coefficient of sound absorption.
const ATTENUATION: f64 = 0.9999;

//// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
// fn step(excitation: f64, noise: f64) {
//   // Calculate reflections in the buccal cavity.

//   // Glottal excitation enters left and labial reflection enters right
//   buccal.junction_right[0] = buccal.left[0] * K_GLOTTAL + excitation;
//   buccal.junction_left[ORAL_LENGTH] = buccal.right[ORAL_LENGTH - 1] * K_LABIAL;

//   // reflection {w} at each junction
//   for m in 0..ORAL_LENGTH {
//     let w = buccal.k[m] * (buccal.right[m - 1] + buccal.left[m]); // reflection
//     buccal.junction_right[m] = buccal.right[m - 1] - w;
//     buccal.junction_left[m] = buccal.left[m] + w;
//   }

//   // Calculate reflections at the velopharyngeal junction
//   let v = vel;
//   junctionL[v] = K_VELUM_LEFT * R[v - 1] + (1 + K_VELUM_LEFT) * (nasalL[0] + L[v]);
//   junctionR[v] = K_VELUM_RIGHT * L[v] + (1 + K_VELUM_RIGHT) * (R[v - 1] + nasalL[0]);
//   nasalJunctionR[0] = K_NASAL * nasalL[0] + (1 + K_NASAL) * (L[v] + R[v - 1]);

//    // Transfer attenuated energy to
//   for m in 0..ORAL_LENGTH {
//       buccal.right[m] = buccal.junction_right[m] * attenuation;
//       buccal.left[m] = buccal.junction_left[m+1] * attenuation;
//   }
// }

const block_size: usize = 128;
const SAMPLE_RATE: f64 = 44100.0;

/// A stateful vocal tract filter.
// #[derive(Clone, Debug)]
pub struct Tract {
    oral: Cavity,
    nasal: Cavity,
    sample_rate: usize,
    block_size: usize,
}

impl Tract {
    /// Creates a new comb filter. Samples are delayed for `delay_length` seconds.
    pub fn new(sample_rate: usize) -> Tract {
        Tract {
            oral: Cavity::new(ORAL_LENGTH),
            nasal: Cavity::new(NASAL_LENGTH),
            sample_rate,
            block_size,
        }
    }

    pub fn pre_block(&mut self) {}
    pub fn post_block(&mut self) {}

    pub fn tick(&mut self, excitation: f64, noise: f64) -> f64 {
        let oral = &mut self.oral;
        let nasal = &mut self.nasal;

        // run step twice per sample
        step(excitation, noise, oral, nasal);
        step(excitation, noise, oral, nasal);

        // sample output from the right-end of tract.
        return oral.right[ORAL_LENGTH - 1] + nasal.right[NASAL_LENGTH - 1];
    }
}

// TODO: find an alternative to static mut for handling cavity mutation
/// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
fn step(excitation: f64, _noise: f64, oral: &mut Cavity, nasal: &mut Cavity) {
    // TODO process turnbulance noise
    // let noise_output = noise

    // Calculate reflections in the buccal cavity.
    // Glottal excitation enters left and labial reflection enters right
    oral.j_right[0] = oral.left[0] * K_GLOTTAL + excitation;
    oral.j_left[ORAL_LENGTH] = oral.right[ORAL_LENGTH - 1] * K_LABIAL;

    // reflection {w} at each junction
    for m in 0..ORAL_LENGTH {
        let w = oral.k[m] * (oral.right[m - 1] + oral.left[m]); // reflection
        oral.j_right[m] = oral.right[m - 1] - w;
        oral.j_left[m] = oral.left[m] + w;
    }

    // Calculate reflections at the velopharyngeal junction
    oral.j_left[VELUM_INDEX] = K_VELUM_LEFT * oral.right[VELUM_INDEX - 1]
        + (1.0 + K_VELUM_LEFT) * (nasal.left[0] + oral.left[VELUM_INDEX]);
    oral.j_right[VELUM_INDEX] = K_VELUM_RIGHT * oral.left[VELUM_INDEX]
        + (1.0 + K_VELUM_RIGHT) * (oral.right[VELUM_INDEX - 1] + nasal.left[0]);
    nasal.j_right[0] = K_NOSE * nasal.left[0]
        + (1.0 + K_NOSE) * (oral.left[VELUM_INDEX] + oral.right[VELUM_INDEX - 1]);

    // Transfer attenuated energy in oral cavity
    for m in 0..ORAL_LENGTH {
        oral.right[m] = oral.j_right[m] * ATTENUATION;
        oral.left[m] = oral.j_left[m + 1] * ATTENUATION;
    }

    // calculate reflection at the nose
    nasal.j_left[NASAL_LENGTH] = nasal.right[NASAL_LENGTH - 1] * K_NOSE;

    // calculate reflections for each section (m) in nasal cavity
    for m in 1..NASAL_LENGTH {
        let w = nasal.k[m] * (nasal.right[m - 1] + nasal.left[m]);
        nasal.j_right[m] = nasal.right[m - 1] - w;
        nasal.j_left[m] = nasal.left[m] + w;
    }

    // calculate decay for each section (m) in nasal cavity
    for m in 0..NASAL_LENGTH {
        nasal.right[m] = nasal.j_right[m] * ATTENUATION;
        nasal.left[m] = nasal.j_left[m + 1] * ATTENUATION;
    }
}
