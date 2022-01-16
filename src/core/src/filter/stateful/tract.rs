/// A line of sections through which sound can propagate.
pub struct Cavity {
    /// Cross-sectional area of each section.
    pub diameter: Vec<f64>,
    /// Cross-sectional area of each section.
    pub area: Vec<f64>,
    /// Reflections at each section.
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
    pub fn new(size: usize) -> Cavity {
        Cavity {
            diameter: vec![0.0; size],
            area: vec![0.0; size],
            k: vec![0.0; size],
            left: vec![0.0; size],
            right: vec![0.0; size],
            j_left: vec![0.0; size],
            j_right: vec![0.0; size],
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

/// Coefficient of reflection at the nose.
const K_NOSE: f64 = -0.9;

const K_SOFT: f64 = 0.8;
const K_HARD: f64 = 0.9;

/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: usize = 17;

/// The coefficient of sound absorption.
const ATTENUATION: f64 = 0.9999;

struct Nasopharynx {
    k_right: f64,
    k_left: f64,
    k_nose: f64,
}
/// A stateful vocal tract filter.
// #[derive(Clone, Debug)]
pub struct Tract {
    oral: Cavity,
    nasal: Cavity,
    nasopharynx: Nasopharynx,
}

impl Tract {
    /// Creates a new comb filter. Samples are delayed for `delay_length` seconds.
    pub fn new() -> Tract {
        let oral = Cavity::new(ORAL_LENGTH);
        let nasal = Cavity::new(NASAL_LENGTH);
        let nasopharynx = Nasopharynx {
            k_right: 0.0,
            k_left: 0.0,
            k_nose: 0.0,
        };

        Tract {
            oral,
            nasal,
            nasopharynx,
        }
    }

    pub fn init(&mut self) {
        self.calculate_oral_reflections();
        self.calculate_nasal_reflections();
    }

    // TODO: Finish converting theses functions from typescript
    fn calculate_oral_reflections(&mut self) {
        for m in 0..ORAL_LENGTH {
            self.oral.area[m] = circle_area(self.oral.diameter[m])
        }
        for m in 1..ORAL_LENGTH {
            // let coefficient = if m > this.pharynxEnd {K_HARD} else {K_SOFT}
            let coefficient = K_SOFT;
            // prevent error if 0
            self.oral.k[m] = if self.oral.area[m] == 0.0 {
                0.999
            } else {
                kelly_lochbaum(self.oral.area[m - 1], self.oral.area[m]) * coefficient
            }
        }

        // now at velopharyngeal junction / port
        let sum =
            self.oral.area[VELUM_INDEX] + self.oral.area[VELUM_INDEX + 1] + self.nasal.area[0];
        self.nasopharynx.k_left = (2.0 * self.oral.area[VELUM_INDEX] - sum) / sum;
        self.nasopharynx.k_right = (2.0 * self.oral.area[VELUM_INDEX + 1] - sum) / sum;
        self.nasopharynx.k_nose = (2.0 * self.nasal.area[0] - sum) / sum;
    }

    fn calculate_nasal_reflections(&mut self) {
        for m in 0..NASAL_LENGTH {
            self.nasal.area[m] = circle_area(self.nasal.diameter[m])
        }
        for m in 1..NASAL_LENGTH {
            self.nasal.k[m] = kelly_lochbaum(self.nasal.area[m - 1], self.nasal.area[m])
        }
    }

    // TODO: find an alternative to static mut for handling cavity mutation
    /// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
    fn step(&mut self, excitation: f64, _noise: f64) {
        // TODO process turnbulance noise
        // let noise_output = noise

        let oral = &mut self.oral;
        let nasal = &mut self.nasal;

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
        oral.j_left[VELUM_INDEX] = self.nasopharynx.k_left * oral.right[VELUM_INDEX - 1]
            + (1.0 + self.nasopharynx.k_left) * (nasal.left[0] + oral.left[VELUM_INDEX]);
        oral.j_right[VELUM_INDEX] = self.nasopharynx.k_right * oral.left[VELUM_INDEX]
            + (1.0 + self.nasopharynx.k_right) * (oral.right[VELUM_INDEX - 1] + nasal.left[0]);
        nasal.j_right[0] = self.nasopharynx.k_nose * nasal.left[0]
            + (1.0 + self.nasopharynx.k_nose)
                * (oral.left[VELUM_INDEX] + oral.right[VELUM_INDEX - 1]);

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

    pub fn pre_block(&mut self) {}
    pub fn post_block(&mut self) {}

    pub fn process(&mut self, excitation: f64, noise: f64) -> f64 {
        // run step twice per sample
        self.step(excitation, noise);
        self.step(excitation, noise);

        // sample output from the right-end of tract.
        return self.oral.right[ORAL_LENGTH - 1] + self.nasal.right[NASAL_LENGTH - 1];
    }
}
