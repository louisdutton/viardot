package viardot

import "core:math"

// Returns an exponential ease-in interpolated value in range [0-1].
exponential :: proc(x: f64) -> f64 {
	if x == 0.0 {
		return 0.0
	}
	return math.pow(2.0, 10.0 * x - 10.0)
}
