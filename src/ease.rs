/// Returns an exponential ease-in interpolated value in range [0-1].
pub fn exponential(x: f64) -> f64 {
    match x {
        0.0 => 0.0,
        _ => f64::powf(2.0, 10.0 * x - 10.0),
    }
}