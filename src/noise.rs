use rand::random;

/// Generates white noise with uniform distribution.
///
/// Returns a random floating-point value between 0.0 and 1.0 with equal
/// probability for all values in the range. White noise has a flat frequency
/// spectrum and no correlation between samples.
///
/// # Returns
///
/// A random f64 value in the range [0.0, 1.0].
pub fn white() -> f64 {
    random()
}

/// Generates Gaussian (normal) noise using the Central Limit Theorem.
///
/// This function approximates a normal distribution by summing 16 uniform
/// random variables and applying appropriate scaling. The resulting distribution
/// has mean ≈ 0 and standard deviation ≈ 1.
///
/// The approximation works because the CLT states that the sum of independent
/// random variables approaches a normal distribution as the number of variables
/// increases.
///
/// # Returns
///
/// A random f64 value following an approximate normal distribution with
/// mean ≈ 0.0 and standard deviation ≈ 1.0.
pub fn gaussian() -> f64 {
    let mut s = 0.0;
    for _c in 0..16 {
        s += random::<f64>()
    }
    return (s - 8.0) / 4.0;
}

/// Generates 1D simplex noise.
///
/// Simplex noise is a gradient noise function that produces smooth, continuous
/// random values. It's an improvement over Perlin noise with better visual
/// isotropy and lower computational complexity. The noise is coherent - nearby
/// input values produce similar output values.
///
/// This implementation uses a simple 1D lattice with linear interpolation
/// and quintic smoothing for C2 continuity.
///
/// # Arguments
///
/// * `x` - Input coordinate for noise sampling
///
/// # Returns
///
/// A noise value approximately in the range [-1.0, 1.0], though values may
/// occasionally exceed this range due to the nature of the algorithm.
pub fn simplex(x: f64) -> f64 {
    let i0 = x.floor() as i32;
    let i1 = i0 + 1;
    let x0 = x - i0 as f64;
    let x1 = x0 - 1.0;

    let mut t0 = 1.0 - x0 * x0;
    t0 *= t0;
    let n0 = t0 * t0 * dot_grad1(hash(i0), x0);

    let mut t1 = 1.0 - x1 * x1;
    t1 *= t1;
    let n1 = t1 * t1 * dot_grad1(hash(i1), x1);

    0.395 * (n0 + n1)
}

fn hash(i: i32) -> i32 {
    let mut h = i as u32;
    h ^= h >> 16;
    h = h.wrapping_mul(0x85ebca6b);
    h ^= h >> 13;
    h = h.wrapping_mul(0xc2b2ae35);
    h ^= h >> 16;
    h as i32
}

fn dot_grad1(hash: i32, x: f64) -> f64 {
    let h = hash & 3;
    let grad = if h & 1 == 0 { 1.0 } else { -1.0 };
    grad * x
}
