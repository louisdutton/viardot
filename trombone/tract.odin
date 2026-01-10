package trombone

import "core:math"

TRACT_N :: 44 // the number of sections in the buccal cavity
NASAL_N :: 28 // the number of sections in the nasal cavity
BLADE_START :: 10 // the position of the blade of the tongue within the buccal cavity
TIP_START :: 32 // the position of the tip of the tongue within the buccal cavity
LIP_START :: 39 // the position of the lip within the buccal cavity
NOSE_START :: 17 // the position of the nasal opening
K_GLOTTAL :: 0.75 // coefficient of reflection at the glottis
K_LABIAL :: -0.85 // coefficient of labial reflection
K_NOSE :: -0.9 // coefficient of nasal reflection
ATTENUATION :: 0.9999 // the efficiency of the energy transfer through junctions

// Vocal tract filter
Tract :: struct {
	// Dimensions
	diameter:            [TRACT_N]f32,
	rest_diameter:       [TRACT_N]f32,
	target_diameter:     [TRACT_N]f32,
	// Wave propagation
	left:                [TRACT_N]f32,
	right:               [TRACT_N]f32,
	reflection:          [TRACT_N + 1]f32,
	new_reflection:      [TRACT_N + 1]f32,
	junction_out_l:      [TRACT_N + 1]f32,
	junction_out_r:      [TRACT_N + 1]f32,
	area:                [TRACT_N]f32,
	// Nasal cavity
	nose_diameter:       [NASAL_N]f32,
	nose_left:           [NASAL_N]f32,
	nose_right:          [NASAL_N]f32,
	nose_reflection:     [NASAL_N + 1]f32,
	nose_junction_out_l: [NASAL_N + 1]f32,
	nose_junction_out_r: [NASAL_N + 1]f32,
	nose_area:           [NASAL_N]f32,
	// Velum (nose junction)
	velum_target:        f32,
	// Tongue control
	tongue_index:        f32,
	tongue_diameter:     f32,
	// Transients
	transients:          [dynamic]Transient,
	// Turbulence
	fricative_intensity: f32,
	// Lip output
	lip_output:          f32,
	nose_output:         f32,
}

Transient :: struct {
	position:   int,
	time_alive: f32,
	lifetime:   f32,
	strength:   f32,
	exponent:   f32,
}

tract_new :: proc() -> (t: Tract) {
	// Initialize tongue position
	t.tongue_index = 12.9
	t.tongue_diameter = 2.43
	t.velum_target = 0.01

	// Set up rest diameters (anatomical shape)
	for i in 0 ..< TRACT_N {
		diameter: f32 = 0
		if i < 7 {
			diameter = 0.6
		} else if i < BLADE_START {
			diameter = 1.1
		} else if i >= LIP_START {
			diameter = 1.5
		} else {
			diameter = 1.5
		}
		t.rest_diameter[i] = diameter
		t.target_diameter[i] = diameter
		t.diameter[i] = diameter
	}

	// Set up nasal cavity
	for i in 0 ..< NASAL_N {
		d := 2.0 * f32(i) / f32(NASAL_N)
		diameter: f32
		if d < 1.0 {
			diameter = 0.4 + 1.6 * d
		} else {
			diameter = 0.5 + 1.5 * (2.0 - d)
		}
		t.nose_diameter[i] = min(diameter, 1.9)
	}
	t.nose_diameter[0] = t.velum_target

	tract_calculate_reflections(&t)
	tract_calculate_nose_reflections(&t)

	t.transients = make([dynamic]Transient)

	return t
}

tract_destroy :: proc(t: ^Tract) {
	delete(t.transients)
}

tract_set_rest_diameter :: proc(t: ^Tract) {
	// Apply tongue shape to tract
	for i in BLADE_START ..< LIP_START {
		fi := f32(i)
		tongue_idx := t.tongue_index
		tongue_diam := t.tongue_diameter

		curve_t := 1.1 * math.PI * (tongue_idx - fi) / (TIP_START - BLADE_START)
		fixed_diam := 2 + (tongue_diam - 2) / 1.5
		curve := (1.5 - fixed_diam + 1.7) * math.cos(curve_t)

		if i == BLADE_START - 2 || i == LIP_START - 1 {
			curve *= 0.8
		}
		if i == BLADE_START || i == LIP_START - 2 {
			curve *= 0.94
		}

		t.rest_diameter[i] = 1.5 - curve
	}

	// Copy rest to target
	for i in 0 ..< TRACT_N {
		t.target_diameter[i] = t.rest_diameter[i]
	}
}

tract_calculate_reflections :: proc(t: ^Tract) {
	for i in 0 ..< TRACT_N {
		t.area[i] = t.diameter[i] * t.diameter[i]
	}

	for i in 1 ..< TRACT_N {
		if t.area[i] == 0 {
			t.new_reflection[i] = 0.999
		} else {
			t.new_reflection[i] = (t.area[i - 1] - t.area[i]) / (t.area[i - 1] + t.area[i])
		}
	}

	// Nose junction
	nose_area := t.nose_diameter[0] * t.nose_diameter[0]
	area_sum := t.area[NOSE_START] + t.area[NOSE_START + 1] + nose_area
	t.reflection[NOSE_START] = (2 * t.area[NOSE_START] - area_sum) / area_sum
}

tract_calculate_nose_reflections :: proc(t: ^Tract) {
	for i in 0 ..< NASAL_N {
		t.nose_area[i] = t.nose_diameter[i] * t.nose_diameter[i]
	}
	for i in 1 ..< NASAL_N {
		t.nose_reflection[i] =
			(t.nose_area[i - 1] - t.nose_area[i]) / (t.nose_area[i - 1] + t.nose_area[i])
	}
}

tract_step :: proc(t: ^Tract, glottal_output: f32, turbulence_noise: f32, lambda: f32) {
	// Process transients
	for i := len(t.transients) - 1; i >= 0; i -= 1 {
		trans := &t.transients[i]
		amplitude := trans.strength * math.pow(2.0, -trans.exponent * trans.time_alive)
		t.right[trans.position] += amplitude / 2.0
		t.left[trans.position] += amplitude / 2.0
		trans.time_alive += 1 / (SAMPLE_RATE * 2)
		if trans.time_alive > trans.lifetime {
			ordered_remove(&t.transients, i)
		}
	}

	// Interpolate reflections
	for i in 0 ..< TRACT_N + 1 {
		t.reflection[i] = math.lerp(t.reflection[i], t.new_reflection[i], lambda)
	}

	// Junction calculations
	t.junction_out_r[0] = t.left[0] * K_GLOTTAL + glottal_output
	t.junction_out_l[TRACT_N] = t.right[TRACT_N - 1] * K_LABIAL

	for i in 1 ..< TRACT_N {
		r := t.reflection[i]
		w := r * (t.right[i - 1] + t.left[i])
		t.junction_out_r[i] = t.right[i - 1] - w
		t.junction_out_l[i] = t.left[i] + w
	}

	// Nose junction
	nose_area := t.nose_diameter[0] * t.nose_diameter[0]
	area_sum := t.area[NOSE_START] + t.area[NOSE_START + 1] + nose_area

	r_left := (2 * t.area[NOSE_START] - area_sum) / area_sum
	r_right := (2 * t.area[NOSE_START + 1] - area_sum) / area_sum
	r_nose := (2 * nose_area - area_sum) / area_sum

	t.junction_out_l[NOSE_START] =
		r_left * t.right[NOSE_START - 1] + (1 + r_left) * (t.nose_left[0] + t.left[NOSE_START])
	t.junction_out_r[NOSE_START] =
		r_right * t.left[NOSE_START] + (1 + r_right) * (t.right[NOSE_START - 1] + t.nose_left[0])
	t.nose_junction_out_r[0] =
		r_nose * t.nose_left[0] + (1 + r_nose) * (t.left[NOSE_START] + t.right[NOSE_START - 1])

	// Update waves
	for i in 0 ..< TRACT_N {
		t.right[i] = t.junction_out_r[i] * ATTENUATION
		t.left[i] = t.junction_out_l[i + 1] * ATTENUATION
	}

	// Lip output
	t.lip_output = t.right[TRACT_N - 1]

	// Nose cavity
	t.nose_junction_out_l[NASAL_N] = t.nose_right[NASAL_N - 1] * K_NOSE

	for i in 1 ..< NASAL_N {
		r := t.nose_reflection[i]
		w := r * (t.nose_right[i - 1] + t.nose_left[i])
		t.nose_junction_out_r[i] = t.nose_right[i - 1] - w
		t.nose_junction_out_l[i] = t.nose_left[i] + w
	}

	for i in 0 ..< NASAL_N {
		t.nose_right[i] = t.nose_junction_out_r[i] * ATTENUATION
		t.nose_left[i] = t.nose_junction_out_l[i + 1] * ATTENUATION
	}

	t.nose_output = t.nose_right[NASAL_N - 1]
}

// Runs at 2x sample rate
tract_process :: proc(t: ^Tract, glottal_output: f32, turbulence_noise: f32, lambda: f32) -> f32 {
	tract_step(t, glottal_output, turbulence_noise, lambda)
	tract_step(t, glottal_output, turbulence_noise, lambda)
	return t.lip_output + t.nose_output
}

tract_finish_block :: proc(t: ^Tract) {
	// Move diameters towards targets
	for i in 0 ..< TRACT_N {
		slow_return := 0.6 + 0.4 * f32(NOSE_START - i) / NOSE_START if i < NOSE_START else 1
		t.diameter[i] = move_towards(t.diameter[i], t.target_diameter[i], slow_return * 0.25)
	}

	// Update velum
	AMOUNT :: 0.25
	t.nose_diameter[0] = move_towards(t.nose_diameter[0], t.velum_target, AMOUNT)

	tract_calculate_reflections(t)
	tract_calculate_nose_reflections(t)
}
