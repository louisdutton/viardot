/// The nasopharyngeal junction.
#[derive(Clone, Debug)]
pub struct Velum {
    pub k_right: f64,
    pub k_left: f64,
    pub k_nose: f64,
    pub target_diameter: f64,
    pub max_diameter: f64,
}

impl Velum {
    pub fn new(target_diameter: f64, max_diameter: f64) -> Velum {
        Velum {
            k_right: 0.0,
            k_left: 0.0,
            k_nose: 0.0,
            target_diameter,
            max_diameter,
        }
    }
}
