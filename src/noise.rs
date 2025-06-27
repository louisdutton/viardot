use rand;

/// White noise generator function.
pub fn white() -> impl Fn(f64) -> f64 {
    move |_t| rand::random::<f64>()
}

/// Gaussian noise generator function using central limit theorem approximation.
pub fn gaussian() -> impl Fn(f64) -> f64 {
    move |_t| {
        let mut s = 0.0;
        for _c in 0..16 {
            s += rand::random::<f64>()
        }
        return (s - 8.0) / 4.0;
    }
}

