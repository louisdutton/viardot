// Number of segments in the each cavity.
pub const ORAL_LENGTH: usize = 44;
pub const NASAL_LENGTH: usize = 28;

pub struct OralCavity {
  pub k: [f32; ORAL_LENGTH],
  pub left: [f32; ORAL_LENGTH],
  pub right: [f32; ORAL_LENGTH],
  pub junction_left: [f32; ORAL_LENGTH + 1],
  pub junction_right: [f32; ORAL_LENGTH + 1],
}

pub struct NasalCavity {
  pub k: [f32; NASAL_LENGTH],
  pub left: [f32; NASAL_LENGTH],
  pub right: [f32; NASAL_LENGTH],
  pub junction_left: [f32; NASAL_LENGTH + 1],
  pub junction_right: [f32; NASAL_LENGTH + 1],
}
