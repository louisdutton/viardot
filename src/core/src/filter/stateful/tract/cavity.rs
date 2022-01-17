/// A line of sections through which sound can propagate.
#[derive(Clone, Debug)]
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
            left: vec![0.0; size],
            right: vec![0.0; size],
            k: vec![0.0; size + 1],
            j_left: vec![0.0; size + 1],
            j_right: vec![0.0; size + 1],
        }
    }
}
