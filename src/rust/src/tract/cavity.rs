/// Number of sections in the oral cavity.
pub const ORAL_LENGTH: usize = 44;
/// Number of sections in the oral cavity.
pub const NASAL_LENGTH: usize = 28;

/// The oral cavity (composed of buccal & pharyngeal cavities).
pub struct OralCavity {
  pub k: [f32; ORAL_LENGTH],
  /// Left-moving components at section.
  pub left: [f32; ORAL_LENGTH],
  /// Right-moving components at section.
  pub right: [f32; ORAL_LENGTH],
  /// Left-moving components at junction.
  pub j_left: [f32; ORAL_LENGTH + 1],
  /// Right-moving components at junction.
  pub j_right: [f32; ORAL_LENGTH + 1],
}

/// The nasal cavity.
pub struct NasalCavity {
  pub k: [f32; NASAL_LENGTH],
  /// Left-moving components at section.
  pub left: [f32; NASAL_LENGTH],
  /// Right-moving components at section.
  pub right: [f32; NASAL_LENGTH],
  /// Left-moving components at junction.
  pub j_left: [f32; NASAL_LENGTH + 1],
  /// Right-moving components at junction.
  pub j_right: [f32; NASAL_LENGTH + 1],
}
