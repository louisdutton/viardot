pub trait Processor {
  fn process(input_buffer: [f32; 128]) -> [f32; 128];
}