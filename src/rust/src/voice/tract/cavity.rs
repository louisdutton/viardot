/// A line of sections through which sound can propagate.
pub struct Cavity {
  pub k: Vec<f32>,
  /// Left-moving components at section.
  pub left: Vec<f32>,
  /// Right-moving components at section.
  pub right: Vec<f32>,
  /// Left-moving components at junction.
  pub j_left: Vec<f32>,
  /// Right-moving components at junction.
  pub j_right: Vec<f32>,
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
