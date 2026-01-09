package viardot

import "core:math"

ORAL_LENGTH :: 44 // Number of sections in the oral cavity.
NASAL_LENGTH :: 28 // Number of sections in the nasal cavity.
K_GLOTTAL :: 0.7 // Coefficient of reflection at the glottis.
K_LABIAL :: -0.85 // Coefficient of reflection at the labia.
K_NOSE :: -0.8 // Coefficient of reflection at the nose.
K_SOFT_PALATE :: 0.8 // Coefficient of reflection pertaining to the soft palate.
K_HARD_PALATE :: 0.95 // Coefficient of reflection pertaining to the hard palate.
VELUM_INDEX :: 17 // The index of the buccal segment that connects the pharyngeal and nasal cavities.
ATTENUATION :: 0.9999 // The coefficient of sonic attenuation.
ORAL_MAX_DIAMETER :: 3.0 // The maximum diameter of the oral cavity.
GLOTTAL_DIAMETER_RATIO :: (1.0 / 6.0) * (1.0 / 6.0) // The glottal diameter relative to the maximum oral diameter.
GLOTTAL_LENGTH_RATIO :: (1.0 / 6.0) * (1.0 / 6.0)
PHARYNGEAL_DIAMETER_RATIO :: 2.0 / ORAL_MAX_DIAMETER // The pharyngeal diameter relative to the maximum oral diameter
PHARYNGEAL_LENGTH_RATIO :: 1.0 / ORAL_MAX_DIAMETER

// A line of sections through which sound can propagate.
Cavity :: struct {
	diameter: [dynamic]f64, // Diameter of each section
	area:     [dynamic]f64, // Cross-sectional area of each section
	k:        [dynamic]f64, // Reflections at each section
	left:     [dynamic]f64, // Left-moving components at section
	right:    [dynamic]f64, // Right-moving components at section
	j_left:   [dynamic]f64, // Left-moving components at junction
	j_right:  [dynamic]f64, // Right-moving components at junction
}

cavity_new :: proc(size: uint, allocator := context.allocator) -> Cavity {
	diameter := make([dynamic]f64, size, allocator)
	area := make([dynamic]f64, size, allocator)
	left := make([dynamic]f64, size, allocator)
	right := make([dynamic]f64, size, allocator)
	k := make([dynamic]f64, size + 1, allocator)
	j_left := make([dynamic]f64, size + 1, allocator)
	j_right := make([dynamic]f64, size + 1, allocator)

	for i in 0 ..< size {
		diameter[i] = 0.0
		area[i] = 0.0
		left[i] = 0.0
		right[i] = 0.0
	}
	for i in 0 ..< size + 1 {
		k[i] = 0.0
		j_left[i] = 0.0
		j_right[i] = 0.0
	}

	return Cavity {
		diameter = diameter,
		area = area,
		k = k,
		left = left,
		right = right,
		j_left = j_left,
		j_right = j_right,
	}
}

cavity_destroy :: proc(c: ^Cavity) {
	delete(c.diameter)
	delete(c.area)
	delete(c.k)
	delete(c.left)
	delete(c.right)
	delete(c.j_left)
	delete(c.j_right)
}

// The nasopharyngeal junction.
Velum :: struct {
	k_right:         f64,
	k_left:          f64,
	k_nose:          f64,
	target_diameter: f64,
	max_diameter:    f64,
}

velum_new :: proc(target_diameter: f64, max_diameter: f64) -> Velum {
	return Velum {
		k_right = 0,
		k_left = 0,
		k_nose = 0,
		target_diameter = target_diameter,
		max_diameter = max_diameter,
	}
}

// Returns the circular cross-sectional area for a given diameter.
circle_area :: proc(diameter: f64) -> f64 {
	return diameter * diameter / 4.0 * PI
}

// Returns the coefficient of reflection between two cross-sectional areas.
kelly_lochbaum :: proc(a1: f64, a2: f64) -> f64 {
	return (a1 - a2) / (a1 + a2)
}

// A stateful vocal tract filter.
// Implements a 1-dimensional abstraction of a 2-dimensional digital wave-guide model.
Tract :: struct {
	oral_length:          uint, // The number of sections in the oral cavity
	nasal_length:         uint, // The number of sections in the nasal cavity
	oral:                 Cavity, // The tract's oral cavity
	nasal:                Cavity, // The tract's nasal cavity
	velum:                Velum, // The tract's velum
	oral_diameter_rest:   [dynamic]f64, // The tract's rest diameter
	oral_diameter_target: [dynamic]f64, // The tract's target diameter
	transients:           [dynamic]f64, // Alive transient impulses
	last_obstruction:     i8, // Index of most recent closure
}

tract_new :: proc(oral_length: uint, nasal_length: uint, allocator := context.allocator) -> Tract {
	oral := cavity_new(oral_length, allocator)
	nasal := cavity_new(nasal_length, allocator)
	velum := velum_new(0.03, 0.1)

	// Initialize oral cavity
	glottal_end := uint(f64(oral_length) * GLOTTAL_LENGTH_RATIO)
	glottal_diameter := ORAL_MAX_DIAMETER * GLOTTAL_DIAMETER_RATIO
	pharyngeal_end := uint(f64(oral_length) * PHARYNGEAL_LENGTH_RATIO)
	pharyngeal_diameter := ORAL_MAX_DIAMETER * PHARYNGEAL_DIAMETER_RATIO
	glottal_difference := pharyngeal_diameter - glottal_diameter

	oral_diameter_rest := make([dynamic]f64, oral_length, allocator)
	oral_diameter_target := make([dynamic]f64, oral_length, allocator)

	// Generate oral cavity shape / diameter
	for m in 0 ..< oral_length {
		diameter: f64
		if m < glottal_end {
			diameter =
				glottal_diameter + exponential(f64(m) / f64(glottal_end)) * glottal_difference
		} else if m < pharyngeal_end {
			diameter = pharyngeal_diameter
		} else {
			diameter = ORAL_MAX_DIAMETER
		}

		oral.diameter[m] = diameter
		oral_diameter_rest[m] = diameter
		oral_diameter_target[m] = diameter
	}

	// Initialize nasal cavity
	for i in 0 ..< nasal_length {
		d := 2.0 * (f64(i) / f64(nasal_length))
		diameter: f64
		if d < 1.0 {
			diameter = 0.4 + (1.6 * d)
		} else {
			diameter = 0.2 + 1.2 * (2.0 - d)
		}
		nasal.diameter[i] = min(diameter, 1.2) * f64(nasal_length) / 28.0
	}
	nasal.diameter[0] = velum.target_diameter

	transients := make([dynamic]f64, oral_length, allocator)
	for i in 0 ..< oral_length {
		transients[i] = 0.0
	}

	tract := Tract {
		oral_length          = oral_length,
		nasal_length         = nasal_length,
		oral                 = oral,
		nasal                = nasal,
		velum                = velum,
		oral_diameter_rest   = oral_diameter_rest,
		oral_diameter_target = oral_diameter_target,
		transients           = transients,
		last_obstruction     = -1,
	}

	tract_calculate_oral_reflections(&tract)
	tract_calculate_nasal_reflections(&tract)

	return tract
}

tract_destroy :: proc(t: ^Tract) {
	cavity_destroy(&t.oral)
	cavity_destroy(&t.nasal)
	delete(t.oral_diameter_rest)
	delete(t.oral_diameter_target)
	delete(t.transients)
}

tract_process :: proc(t: ^Tract, excitation: f64, noise: f64) -> f64 {
	// Run step twice per sample
	tract_step(t, excitation, noise)
	tract_step(t, excitation, noise)

	// Sample output from both orifices
	return t.oral.right[t.nasal_length - 1] + t.nasal.right[t.nasal_length - 1]
}

// Calculates the coefficients of reflection for each junction in the oral cavity.
tract_calculate_oral_reflections :: proc(t: ^Tract) {
	for m in 0 ..< t.oral_length {
		t.oral.area[m] = circle_area(t.oral.diameter[m])
	}

	pharyngeal_end := uint(f64(t.oral_length) * PHARYNGEAL_LENGTH_RATIO)
	for m in 1 ..< t.oral_length {
		coefficient: f64 = K_HARD_PALATE if m > pharyngeal_end else K_SOFT_PALATE

		if t.oral.area[m] == 0.0 {
			t.oral.k[m] = ATTENUATION
		} else {
			t.oral.k[m] = kelly_lochbaum(t.oral.area[m - 1], t.oral.area[m]) * coefficient
		}
	}

	// Velopharyngeal junction
	sum := t.oral.area[VELUM_INDEX] + t.oral.area[VELUM_INDEX + 1] + t.nasal.area[0]
	t.velum.k_left = (2.0 * t.oral.area[VELUM_INDEX] - sum) / sum
	t.velum.k_right = (2.0 * t.oral.area[VELUM_INDEX + 1] - sum) / sum
	t.velum.k_nose = (2.0 * t.nasal.area[0] - sum) / sum
}

// Calculates the coefficients of reflection for each junction in the nasal cavity.
tract_calculate_nasal_reflections :: proc(t: ^Tract) {
	for m in 0 ..< t.nasal_length {
		t.nasal.area[m] = circle_area(t.nasal.diameter[m])
	}
	for m in 1 ..< t.nasal_length {
		t.nasal.k[m] = kelly_lochbaum(t.nasal.area[m - 1], t.nasal.area[m])
	}
}

// Simulates the propagation of sound within the vocal tract.
@(private = "file")
tract_step :: proc(t: ^Tract, excitation: f64, noise: f64) {
	oral := &t.oral
	nasal := &t.nasal
	velum := &t.velum

	// Calculate reflections in the buccal cavity
	oral.j_right[0] = oral.left[0] * K_GLOTTAL + excitation
	oral.j_left[t.oral_length] = oral.right[t.oral_length - 1] * K_LABIAL

	// Reflection (w) at each junction
	for m in 1 ..< t.oral_length {
		w := oral.k[m] * (oral.right[m - 1] + oral.left[m])
		oral.j_right[m] = oral.right[m - 1] - w
		oral.j_left[m] = oral.left[m] + w
	}

	// Calculate reflections at the velopharyngeal junction
	oral.j_left[VELUM_INDEX] =
		velum.k_left * oral.right[VELUM_INDEX - 1] +
		(1.0 + velum.k_left) * (nasal.left[0] + oral.left[VELUM_INDEX])
	oral.j_right[VELUM_INDEX] =
		velum.k_right * oral.left[VELUM_INDEX] +
		(1.0 + velum.k_right) * (oral.right[VELUM_INDEX - 1] + nasal.left[0])
	nasal.j_right[0] =
		velum.k_nose * nasal.left[0] +
		(1.0 + velum.k_nose) * (oral.left[VELUM_INDEX] + oral.right[VELUM_INDEX - 1])

	// Transfer attenuated energy in oral cavity
	for m in 0 ..< t.oral_length {
		oral.right[m] = oral.j_right[m] * ATTENUATION
		oral.left[m] = oral.j_left[m + 1] * ATTENUATION
	}

	// Calculate reflection at the nose
	nasal.j_left[t.nasal_length] = nasal.right[t.nasal_length - 1] * K_NOSE

	// Calculate reflection (w) for each section (m) in nasal cavity
	for m in 1 ..< t.nasal_length {
		w := nasal.k[m] * (nasal.right[m - 1] + nasal.left[m])
		nasal.j_right[m] = nasal.right[m - 1] - w
		nasal.j_left[m] = nasal.left[m] + w
	}

	// Attenuate each section (m) in nasal cavity
	for m in 0 ..< t.nasal_length {
		nasal.right[m] = nasal.j_right[m] * ATTENUATION
		nasal.left[m] = nasal.j_left[m + 1] * ATTENUATION
	}
}
