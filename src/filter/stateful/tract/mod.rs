mod cavity;
mod utils;
mod velum;

use cavity::Cavity;
use utils::{circle_area, exponential_ease_in, kelly_lochbaum};
use velum::Velum;

/// Number of sections in the oral cavity.
const ORAL_LENGTH: usize = 44;

/// Number of sections in the oral cavity.
const NASAL_LENGTH: usize = 28;

/// Coefficient of reflection at the glottis.
const K_GLOTTAL: f64 = 0.7;

/// Coefficient of reflection at the labia.
const K_LABIAL: f64 = -0.85;

/// Coefficient of reflection at the nose.
const K_NOSE: f64 = -0.8;

/// Coefficient of reflection pertaining to the soft palate.
const K_SOFT_PALATE: f64 = 0.8;

/// Coefficient of reflection pertaining to the hard palate.
const K_HARD_PALATE: f64 = 0.95;

/// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const VELUM_INDEX: usize = 17;

/// The coefficient of sonic attenutation.
const ATTENUATION: f64 = 0.9999;

/// The maximum diamter of the oral cavity.
/// This is essentially an arbitrary scale factor
const ORAL_MAX_DIAMETER: f64 = 3.0;

/// The glottal diameter relative to the maximum oral diameter.
const GLOTTAL_DIAMETER_RATIO: f64 = (1. / 6.) * (1. / 6.);
const GLOTTAL_LENGTH_RATIO: f64 = (1. / 6.) * (1. / 6.);

/// The pharyngeal diameter relative to the maximum oral diameter.
const PHARYNGEAL_DIAMETER_RATIO: f64 = 2. / 3.;
const PHARYNGEAL_LENGTH_RATIO: f64 = 1. / 3.;

/// A stateful vocal tract filter.
///
/// Implements a 1-dimensional abstraction of a 2-dimensional digital wave-guide model.
#[derive(Clone, Debug)]
pub struct Tract {
    /// The number of sections in the oral cavity.
    oral_length: usize,
    /// The number of sections in the nasal cavity.
    nasal_length: usize,
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
    pub fn new(oral_length: usize, nasal_length: usize) -> Tract {
        let mut oral = Cavity::new(oral_length);
        let mut nasal = Cavity::new(nasal_length);
        let velum = Velum::new(0.03, 0.1);

        // Initalialise oral cavity
        let glottal_end = (oral_length as f64 * GLOTTAL_LENGTH_RATIO) as usize;
        let glottal_diameter = ORAL_MAX_DIAMETER * GLOTTAL_DIAMETER_RATIO;
        let pharyngeal_end = (oral_length as f64 * PHARYNGEAL_LENGTH_RATIO) as usize;
        let pharyngeal_diameter = ORAL_MAX_DIAMETER * PHARYNGEAL_DIAMETER_RATIO;
        let glottal_difference = pharyngeal_diameter - glottal_diameter;
        let mut oral_diameter_rest = vec![0.0; oral_length];
        let mut oral_diameter_target = vec![0.0; oral_length];

        // Generate oral cavity shape / diameter
        for m in 0..oral_length {
            let diameter = if (m) < glottal_end {
                glottal_diameter
                    + exponential_ease_in(m as f64 / glottal_end as f64) * glottal_difference
            } else if m < pharyngeal_end {
                pharyngeal_diameter
            } else {
                ORAL_MAX_DIAMETER
            };

            oral.diameter[m] = diameter;
            oral_diameter_rest[m] = diameter;
            oral_diameter_target[m] = diameter;
        }

        // Initalialise nasal cavity
        // TODO try and get rid of magic numbers if possible
        for i in 0..nasal_length {
            let d = 2.0 * (i as f64 / nasal_length as f64);
            let diameter = if d < 1.0 {
                0.4 + (1.6 * d)
            } else {
                0.2 + 1.2 * (2.0 - d)
            };
            nasal.diameter[i] = diameter.min(1.2) * nasal_length as f64 / 28.0
        }
        nasal.diameter[0] = velum.target_diameter; // ??

        let mut tract = Tract {
            oral_length,
            nasal_length,
            oral,
            nasal,
            velum,
            oral_diameter_rest,
            oral_diameter_target,
            transients: vec![0.0; oral_length],
            last_obstruction: -1,
        };

        tract.calculate_oral_reflections();
        tract.calculate_nasal_reflections();
        tract
    }

    pub fn process(&mut self, excitation: f64, noise: f64) -> f64 {
        // run step twice per sample
        // TODO: document why
        self.step(excitation, noise);
        self.step(excitation, noise);

        // sample output from both orifices right-end of tract.
        return self.oral.right[self.nasal_length - 1] + self.nasal.right[self.nasal_length - 1];
    }

    /// Calculates the coefficients of reflection for each junction in the oral cavity.
    fn calculate_oral_reflections(&mut self) {
        let oral = &mut self.oral;
        let nasal = &self.nasal;

        for m in 0..self.oral_length {
            oral.area[m] = circle_area(oral.diameter[m])
        }

        let pharyngeal_end = (self.oral_length as f64 * PHARYNGEAL_LENGTH_RATIO) as usize;
        for m in 1..self.oral_length {
            let coefficient = if m > pharyngeal_end {
                K_HARD_PALATE
            } else {
                K_SOFT_PALATE
            };

            oral.k[m] = match oral.area[m] {
                0. => ATTENUATION, // prevent zero division
                _ => kelly_lochbaum(oral.area[m - 1], oral.area[m]) * coefficient,
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
        for m in 0..self.nasal_length {
            self.nasal.area[m] = circle_area(self.nasal.diameter[m])
        }
        for m in 1..self.nasal_length {
            self.nasal.k[m] = kelly_lochbaum(self.nasal.area[m - 1], self.nasal.area[m])
        }
    }

    /// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
    fn step(&mut self, excitation: f64, _noise: f64) {
        // TODO process turbulance noise
        // let noise_output = noise

        let oral = &mut self.oral;
        let nasal = &mut self.nasal;
        let velum = &mut self.velum;

        // Calculate reflections in the buccal cavity.
        // Glottal excitation enters left and labial reflection enters right
        oral.j_right[0] = oral.left[0] * K_GLOTTAL + excitation;
        oral.j_left[self.oral_length] = oral.right[self.oral_length - 1] * K_LABIAL;

        // Reflection (w) at each junction
        for m in 1..self.oral_length {
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
        for m in 0..self.oral_length {
            oral.right[m] = oral.j_right[m] * ATTENUATION;
            oral.left[m] = oral.j_left[m + 1] * ATTENUATION;
        }

        // Calculate reflection at the nose
        nasal.j_left[self.nasal_length] = nasal.right[self.nasal_length - 1] * K_NOSE;

        // Calculate reflection (w) for each section (m) in nasal cavity
        for m in 1..self.nasal_length {
            let w = nasal.k[m] * (nasal.right[m - 1] + nasal.left[m]);
            nasal.j_right[m] = nasal.right[m - 1] - w;
            nasal.j_left[m] = nasal.left[m] + w;
        }

        // Attenuate each section (m) in nasal cavity
        for m in 0..self.nasal_length {
            nasal.right[m] = nasal.j_right[m] * ATTENUATION;
            nasal.left[m] = nasal.j_left[m + 1] * ATTENUATION;
        }
    }
}
