use belcanto::voice;

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

  // let res = wav_test();
}

// fn wav_test() -> std::result::Result<(), std::io::Error> {
//   let mut file = File::create("./test.wav")?;

//   write_wav(
//     &mut file,
//     44_100,
//     &quantize_samples::<i16>(&make_samples(1.0, 44100, waveform)),
//   )
//   .expect("failed to write wav file.");

//   Ok(())
// }
