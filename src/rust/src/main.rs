use belcanto::voice::Voice;
// use belcanto::serialization::wav:

use belcanto::serialization::wav::{write_wav};
use belcanto::synthesis::{make_samples, quantize_samples};
use belcanto::waveform::sine_wave;
use std::fs::File;

fn main() {
  let mut voice = Voice::new(44100, 128);
  let output = voice.process();
  // println!("{:?}", output)

  let res = wav_test();
}

fn wav_test() -> std::result::Result<(), std::io::Error> {
  let mut file = File::create("./test.wav")?;

  write_wav(
    &mut file,
    44_100,
    &quantize_samples::<i16>(&make_samples(0.1, 44_100, sine_wave(440.0))),
  )
  .expect("failed to write wav file.");

  Ok(())
}
