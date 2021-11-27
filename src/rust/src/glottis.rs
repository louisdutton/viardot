use std::f32::consts::PI;
use simdnoise::NoiseBuilder;
use rand::Rng;
use rand::distributions::StandardNormal;

const PI2: f32 = PI * 2.0;

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

  pub fn process(&self) -> [f32; 128] {
    let output = [0.0; 128];
    let wave_function = create_lf_wave_function(&0.0);
    // placeholder values
    let intensity = 0.5;
    let loudness = 0.5;
    let tenseness = 0.0;

    // debug values
    let time = 0.0;
    let current_frame: usize = 0;
    let sample_rate = 44100.0;

    for n in 0..128 {
      // simplex noise
      let s1 = simplex1[n];
      let s2 = simplex2[n];
       
      // vibrato
      let mut vibrato = (self.vibrato.frequency * PI2 * time).sin() * self.vibrato.amplitude;
      vibrato += (s1 * self.vibrato.amplitude/2.0) + (s2 * self.vibrato.amplitude/3.0);
      
      // excitation
      let f0 = self.frequency + vibrato;
      let frame = (current_frame + n) / sample_rate;
      let delta_frequency = frame * (self.frequency - f0); // was prev_freq
      let prevFreq = f0;
      let t = (frame * f0 + this.d) % 1;
      let excitation = wave_function(t);

      // aspiration
      let modulation = floor + amplitude * hanning(t, f0);
      let noise_residual = input[n] * (1+s2*.25) * modulation * tenseness.sqrt();

      output[n] = (excitation + noise_residual) * intensity * loudness;
    }

    return output;
  }
}

/// Creates an waveform model glottal function based on tenseness variable
fn create_lf_wave_function<'a>(tenseness: &'a f32) -> Box<dyn Fn(f32) -> f32 + 'a> {
  // convert tenseness to rd variable
  let rd = 0.5 + 2.2 * (1.0 - tenseness); // must be in range: [.5, 2.7]

  // normalized to time = 1, Ee = 1
  let ra = -0.01 + 0.048 * rd;
  let rk = 0.224 + 0.118 * rd;
  let rg = (rk / 4.0) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk));
  // Timing parameters
  let ta = ra;
  let tp = 1.0 / (2.0 * rg); // instant of maximum glottal flow
  let te = tp + tp * rk;

  let epsilon = 1.0 / ta;
  let shift = (-epsilon * (1.0 - te)).exp(); // exp(-epsilon * (1-te));
  let delta = 1.0 - shift; // divide by this to scale RHS

  let rhs_integral = ((1.0 / epsilon) * (shift - 1.0) + (1.0 - te) * shift) / delta;

  let total_lower_integral = -(te - tp) / 2.0 + rhs_integral;
  let total_upper_integral = -total_lower_integral;

  let omega = PI / tp;
  let sine = f32::sin(omega * te);

  let y = -PI * sine * total_upper_integral / (tp * 2.0);
  let z = y.log10();
  let alpha = z / (tp / 2.0 - te);
  let e0 = -1.0 / (sine * (alpha * te).exp());

  // return glottal waveform function
  return Box::new(move |t: f32| {
    if t > te {
      -((-epsilon * (t - te).exp()) + shift) / delta
    } else {
      e0 * (alpha * t).exp() * (omega * t).sin()
    }
  });
}

// Noise parameters
const floor: f32 = 0.15;
const amplitude: f32 = 0.2;

// Noise buffers
const simplex1: Vec<f32> = NoiseBuilder::fbm_1d(128).with_freq(1.4).generate_scaled(-1.0, 1.0);
const simplex2: Vec<f32> = NoiseBuilder::fbm_1d(128).with_freq(4.2).generate_scaled(-1.0, 1.0);

const gaussian: Vec<f32> = generate_gaussian_buffer(128);

fn generate_gaussian_buffer(size: usize) -> Vec<f32> {
  let mut rng = rand::thread_rng();
  vec![0.0, size]
}