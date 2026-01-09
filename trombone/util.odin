package trombone

import "core:math"

move_towards :: proc(current, target, amount: f64) -> f64 {
	if current < target {
		return min(current + amount, target)
	}
	return max(current - amount, target)
}

simplex_noise :: proc(x: f64) -> f64 {
	// Simple 1D simplex noise
	i0 := int(math.floor(x))
	i1 := i0 + 1
	x0 := x - f64(i0)
	x1 := x0 - 1.0

	t0 := 1.0 - x0 * x0
	t0 *= t0
	n0 := t0 * t0 * simplex_grad(simplex_hash(i0), x0)

	t1 := 1.0 - x1 * x1
	t1 *= t1
	n1 := t1 * t1 * simplex_grad(simplex_hash(i1), x1)

	return 0.395 * (n0 + n1)
}

simplex_hash :: proc(i: int) -> int {
	h := u32(i)
	h ~= h >> 16
	h *= 0x85ebca6b
	h ~= h >> 13
	h *= 0xc2b2ae35
	h ~= h >> 16
	return int(h)
}

simplex_grad :: proc(hash: int, x: f64) -> f64 {
	h := hash & 3
	grad: f64 = 1.0 if (h & 1) == 0 else -1.0
	return grad * x
}
