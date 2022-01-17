mod cavity;
mod utils;
mod velum;

use cavity::Cavity;
use utils::{circle_area, ease, kelly_lochbaum, min};
use velum::Velum;

/// Number of sections in the oral cavity.
const ORAL_LENGTH: usize = 48;
/// Number of sections in the oral cavity.
const NASAL_LENGTH: usize = 28;
/// Coefficient of reflection at the glottis.
const K_GLOTTAL: f64 = 0.7;
/// Coefficient of reflection at the labia.
const K_LABIAL: f64 = -0.85;
/// Coefficient of reflection at the nose.
const K_NOSE: f64 = -0.9;
/// Coefficient of reflection pertaining to the soft palate.
const K_SOFT_PALATE: f64 = 0.6;
/// Coefficient of reflection pertaining to the hard palate.
const K_HARD_PALATE: f64 = 0.9;
/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: usize = 17;
/// The coefficient of sonic attenutation.
const ATTENUATION: f64 = 0.9999;
/// The glottal diameter relative to the maximum oral diameter.
const RATIO_GLOTTAL_DIAMETER: f64 = 0.16667; // (1/6)^2
/// The pharyngeal diameter relative to the maximum oral diameter.
const RATIO_PHARYNGEAL_DIAMETER: f64 = 0.66667;

/// A stateful vocal tract filter.
///
/// Implements a 1-dimensional abstraction of a 2-dimensional digital wave-guide model.
#[derive(Clone, Debug)]
pub struct Tract {
    /// The tract's oral cavity (comprised of glottal, pharyngeal and buccal sections).
    oral: Cavity,
    /// The tract's nasal cavity (static once initalised).
    nasal: Cavity,
    /// The tract's velum (located at the nasopharyngeal junction).
    velum: Velum,
    /// The tract's rest diameter for current tongue position.
    oral_diameter_rest: Vec<f64>,
    /// The tract's target diameter for current tongue position and target phoneme.
    oral_diameter_target: Vec<f64>,
    /// A list of alive transient impulses within the tract (used to form certain consonants).
    transients: Vec<f64>,
    /// The index of the most recent closure/obstruction within the oral cavity (obstructions cause consonants).
    last_obstruction: i8,
}

impl Tract {
    /// Creates a new vocal tract filter with default values.
    pub fn new() -> Tract {
        let mut oral = Cavity::new(ORAL_LENGTH);
        let mut nasal = Cavity::new(NASAL_LENGTH);
        let velum = Velum::new(0.04, 0.1);

        // Initalialise oral cavity
        let oral_diameter = 3.0;
        let glottal_end = ORAL_LENGTH as f64 / 6.0;
        let glottal_diameter = oral_diameter * RATIO_GLOTTAL_DIAMETER;
        let pharyngeal_end = ORAL_LENGTH as f64 / 3.0;
        let pharyngeal_diameter = oral_diameter * RATIO_PHARYNGEAL_DIAMETER;
        let glottal_difference = pharyngeal_diameter - glottal_diameter;
        let mut oral_diameter_rest = vec![0.0; ORAL_LENGTH];
        let mut oral_diameter_target = vec![0.0; ORAL_LENGTH];

        // Generate oral cavity shape / diameter
        for m in 0..ORAL_LENGTH {
            let diameter = if (m as f64) < glottal_end {
                glottal_diameter + ease((m as f64) / glottal_end) * glottal_difference
            } else if (m as f64) < pharyngeal_end {
                pharyngeal_diameter
            } else {
                oral_diameter
            };

            oral.diameter[m] = diameter;
            oral_diameter_rest[m] = diameter;
            oral_diameter_target[m] = diameter;
        }

        // Initalialise nasal cavity
        // TODO try and get rid of magic numbers if possible
        for i in 0..NASAL_LENGTH {
            let d = 2.0 * (i as f64 / NASAL_LENGTH as f64);
            let diameter = if d < 1.0 {
                0.4 + (1.6 * d)
            } else {
                0.2 + 1.2 * (2.0 - d)
            };
            nasal.diameter[i] = min(diameter, 1.2) * NASAL_LENGTH as f64 / 28.0
        }

        // Construct
        Tract {
            oral,
            nasal,
            velum,
            oral_diameter_rest,
            oral_diameter_target,
            transients: vec![0.0; ORAL_LENGTH],
            last_obstruction: -1,
        }
    }

    /// Initialises the vocal tract.
    pub fn init(&mut self) {
        self.calculate_oral_reflections();
        self.calculate_nasal_reflections();
        self.nasal.diameter[0] = self.velum.target_diameter;
    }

    /// Calculates the coefficients of reflection for each junction in the oral cavity.
    fn calculate_oral_reflections(&mut self) {
        let oral = &mut self.oral;
        let nasal = &self.nasal;

        for m in 0..ORAL_LENGTH {
            oral.area[m] = circle_area(oral.diameter[m])
        }
        for m in 1..ORAL_LENGTH {
            // let coefficient = if m > this.pharynxEnd {K_HARD_PALATE} else {K_SOFT_PALATE}
            let coefficient = K_SOFT_PALATE;
            // prevent error if 0
            oral.k[m] = if oral.area[m] == 0.0 {
                ATTENUATION
            } else {
                kelly_lochbaum(oral.area[m - 1], oral.area[m]) * coefficient
            }
        }

        // now at velopharyngeal junction / port
        let sum = oral.area[VELUM_INDEX] + oral.area[VELUM_INDEX + 1] + nasal.area[0];
        self.velum.k_left = (2.0 * oral.area[VELUM_INDEX] - sum) / sum;
        self.velum.k_right = (2.0 * oral.area[VELUM_INDEX + 1] - sum) / sum;
        self.velum.k_nose = (2.0 * nasal.area[0] - sum) / sum;
    }

    /// Calculates the coefficients of reflection for each junction in the nasal cavity.
    fn calculate_nasal_reflections(&mut self) {
        for m in 0..NASAL_LENGTH {
            self.nasal.area[m] = circle_area(self.nasal.diameter[m])
        }
        for m in 1..NASAL_LENGTH {
            self.nasal.k[m] = kelly_lochbaum(self.nasal.area[m - 1], self.nasal.area[m])
        }
    }

    /// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
    fn step(&mut self, excitation: f64, _noise: f64) {
        // TODO process turnbulance noise
        // let noise_output = noise

        let oral = &mut self.oral;
        let nasal = &mut self.nasal;
        let velum = &mut self.velum;

        // Calculate reflections in the buccal cavity.
        // Glottal excitation enters left and labial reflection enters right
        oral.j_right[0] = oral.left[0] * K_GLOTTAL + excitation;
        oral.j_left[ORAL_LENGTH] = oral.right[ORAL_LENGTH - 1] * K_LABIAL;

        // Reflection (w) at each junction
        for m in 1..ORAL_LENGTH {
            let w = oral.k[m] * (oral.right[m - 1] + oral.left[m]); // reflection
            oral.j_right[m] = oral.right[m - 1] - w;
            oral.j_left[m] = oral.left[m] + w;
        }

        // Calculate reflections at the velopharyngeal junction
        oral.j_left[VELUM_INDEX] = velum.k_left * oral.right[VELUM_INDEX - 1]
            + (1.0 + velum.k_left) * (nasal.left[0] + oral.left[VELUM_INDEX]);
        oral.j_right[VELUM_INDEX] = velum.k_right * oral.left[VELUM_INDEX]
            + (1.0 + velum.k_right) * (oral.right[VELUM_INDEX - 1] + nasal.left[0]);
        nasal.j_right[0] = velum.k_nose * nasal.left[0]
            + (1.0 + velum.k_nose) * (oral.left[VELUM_INDEX] + oral.right[VELUM_INDEX - 1]);

        // Transfer attenuated energy in oral cavity
        for m in 0..ORAL_LENGTH {
            oral.right[m] = oral.j_right[m] * ATTENUATION;
            oral.left[m] = oral.j_left[m + 1] * ATTENUATION;
        }

        // Calculate reflection at the nose
        nasal.j_left[NASAL_LENGTH] = nasal.right[NASAL_LENGTH - 1] * K_NOSE;

        // Calculate reflection (w) for each section (m) in nasal cavity
        for m in 1..NASAL_LENGTH {
            let w = nasal.k[m] * (nasal.right[m - 1] + nasal.left[m]);
            nasal.j_right[m] = nasal.right[m - 1] - w;
            nasal.j_left[m] = nasal.left[m] + w;
        }

        // Attenuate each section (m) in nasal cavity
        for m in 0..NASAL_LENGTH {
            nasal.right[m] = nasal.j_right[m] * ATTENUATION;
            nasal.left[m] = nasal.j_left[m + 1] * ATTENUATION;
        }
    }

    pub fn pre_block(&mut self) {}
    pub fn post_block(&mut self) {
        self.calculate_oral_reflections();
    }

    pub fn process(&mut self, excitation: f64, noise: f64) -> f64 {
        // run step twice per sample
        self.step(excitation, noise);
        // self.step(excitation, noise);

        // sample output from the right-end of tract.
        return self.oral.right[ORAL_LENGTH - 1] + self.nasal.right[NASAL_LENGTH - 1];
    }
}
