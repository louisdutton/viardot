package viardot

import "core:math/rand"

// Generates white noise with uniform distribution.
// Returns a random floating-point value between 0.0 and 1.0.
white :: proc() -> f64 {
	return rand.float64()
}

// Generates Gaussian (normal) noise using the Central Limit Theorem.
// Returns a random f64 value following an approximate normal distribution
// with mean ~0.0 and standard deviation ~1.0.
gaussian :: proc() -> f64 {
	s: f64 = 0.0
	for _ in 0 ..< 16 {
		s += rand.float64()
	}
	return (s - 8.0) / 4.0
}

// Generates 1D simplex noise.
// Returns a noise value approximately in the range [-1.0, 1.0].
simplex :: proc(x: f64) -> f64 {
	i0 := i32(math_floor(x))
	i1 := i0 + 1
	x0 := x - f64(i0)
	x1 := x0 - 1.0

	t0 := 1.0 - x0 * x0
	t0 *= t0
	n0 := t0 * t0 * dot_grad1(hash(i0), x0)

	t1 := 1.0 - x1 * x1
	t1 *= t1
	n1 := t1 * t1 * dot_grad1(hash(i1), x1)

	return 0.395 * (n0 + n1)
}

@(private = "file")
math_floor :: proc(x: f64) -> f64 {
	if x >= 0 {
		return f64(i64(x))
	}
	f := f64(i64(x))
	if f == x {
		return f
	}
	return f - 1
}

@(private = "file")
hash :: proc(i: i32) -> i32 {
	h := u32(i)
	h ~= h >> 16
	h *= 0x85ebca6b
	h ~= h >> 13
	h *= 0xc2b2ae35
	h ~= h >> 16
	return i32(h)
}

@(private = "file")
dot_grad1 :: proc(hash_val: i32, x: f64) -> f64 {
	h := hash_val & 3
	grad: f64 = 1.0 if (h & 1) == 0 else -1.0
	return grad * x
}
