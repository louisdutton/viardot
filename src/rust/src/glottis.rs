struct Vibrato {
  frequency: f32,
  amplitude: f32,
}

pub struct Glottis {
  pub frequency: f32,
  vibrato: Vibrato,
  intensity: f32,
  tenseness: f32,
  loudness: f32,
}

impl Glottis {
  pub fn new() -> Glottis {
    let vibrato: Vibrato = Vibrato {
      frequency: 6.0,
      amplitude: 4.0,
    };

    Glottis {
      frequency: 444.0, // A4
      vibrato,
      intensity: 0.0,
      tenseness: 0.0,
      loudness: 0.0,
    }
  }

  pub fn generate(&self) -> [f32; 128] {
    let output = [0.0; 128];
    // for n in 0..128 {
    //   transformed_lf_waveform()
    // }

    return output;
  }

  fn generate_lf_waveform() {}
}
