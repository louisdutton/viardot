// use belcanto::voice::glottis::create_lf_wave_function;

// use belcanto::serialization::wav:

use belcanto::serialization::wav::write_wav;
use belcanto::synthesis::{make_samples, quantize_samples};
use belcanto::waveform::sine_wave;
use std::f64::consts::PI;
use std::fs::File;

fn main() {
  // let mut voice = Voice::new(44100, 128);
  // let output = voice.process();
  // println!("{:?}", output)
  // let wave = create_lf_wave_function(0.0);
  // for i in 0..10 {
  //   let t = (i as f64) / 10.0;
  //   println!("{}", wave(t));
  // }

  let res = wav_test();
}

fn wav_test() -> std::result::Result<(), std::io::Error> {
  let mut file = File::create("./test.wav")?;
  let waveform = lf(create_lf_wave_function(0.0), 220.0);

  write_wav(
    &mut file,
    44_100,
    &quantize_samples::<i16>(&make_samples(1.0, 44100, waveform)),
  )
  .expect("failed to write wav file.");

  Ok(())
}

fn lf<F>(f: F, frequency: f64) -> impl Fn(f64) -> f64
where
  F: Fn(f64) -> f64,
{
  move |t| f(t * frequency)
}

/// Creates an waveform model glottal function based on tenseness variable
fn create_lf_wave_function<'a>(tenseness: f64) -> impl Fn(f64) -> f64 {
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
  let shift = (-epsilon * (1.0 - te)).exp();
  let delta = 1.0 - shift; // divide by this to scale RHS

  let rhs_integral = ((1.0 / epsilon) * (shift - 1.0) + (1.0 - te) * shift) / delta;

  let total_lower_integral = -(te - tp) / 2.0 + rhs_integral;
  let total_upper_integral = -total_lower_integral;

  let omega = PI / tp;
  let sine = (omega * te).sin();

  let y = -PI * sine * total_upper_integral / (tp * 2.0);
  let z = y.ln();
  let alpha = z / (tp / 2.0 - te);
  let e0 = -1.0 / (sine * (alpha * te).exp());

  // return glottal waveform function
  move |time: f64| {
    let t = time % 1.0;
    if t > te {
      (-((-epsilon * (t - te)).exp()) + shift) / delta
    } else {
      e0 * (alpha * t).exp() * (omega * t).sin()
    }
  }
}
