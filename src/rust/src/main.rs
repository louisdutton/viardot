use belcanto::voice::Voice;

fn main() {
  let mut voice = Voice::new(44100, 128);
  let output = voice.process();
  println!("{:?}", output)
}