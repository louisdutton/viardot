package trombone

import "core:math"
import rl "vendor:raylib"

handle_tract_input :: proc(tract: ^Tract, glottis: ^Glottis) {
	if !rl.IsMouseButtonDown(.LEFT) {
		return
	}

	mx := f64(rl.GetMouseX())
	my := f64(rl.GetMouseY())

	// Check if in tract area (above keyboard)
	if my > f64(KEYBOARD_Y) {
		return
	}

	// Touching the tract also activates voice
	glottis.is_touched = true

	// Convert mouse to polar tract coordinates
	dx := mx - f64(TRACT_ORIGIN_X)
	dy := -(my - f64(TRACT_ORIGIN_Y)) // Flip Y for standard math coords

	angle := math.atan2(dy, dx)
	if angle < 0 {
		angle += 2.0 * math.PI
	}
	radius := math.sqrt(dx * dx + dy * dy)

	// Convert angle to tract index (inverse of drawing formula)
	angle_start := math.PI * 1.1
	angle_end := math.PI * -0.15
	angle_range := angle_start - angle_end

	t := (angle_start - angle) / angle_range
	index := t * f64(LIP_START - 1)

	// Convert radius to diameter
	diameter := (radius - f64(TRACT_RADIUS)) / 25.0

	// Check if in tongue control region (inner side, negative diameter)
	if index >= f64(BLADE_START + 2) &&
	   index < f64(TIP_START - 3) &&
	   diameter >= -3.5 &&
	   diameter <= -2.05 {
		tract.tongue_index = clamp(index, f64(BLADE_START + 2), f64(TIP_START - 3))
		tract.tongue_diameter = clamp(-diameter, 2.05, 3.5)
		tract_set_rest_diameter(tract)
	} else if index >= 0 && index < f64(TRACT_N) {
		idx := int(index)
		if idx >= 0 && idx < TRACT_N {
			tract_diam := tract.diameter[idx]
			if diameter >= -tract_diam && diameter <= tract_diam {
				constriction_diam := max(0.0, (diameter + tract_diam) / 2.0)
				for i in max(0, idx - 2) ..< min(TRACT_N, idx + 3) {
					dist := abs(f64(i) - index)
					factor := max(0.0, 1.0 - dist / 3.0)
					tract.target_diameter[i] = min(
						tract.target_diameter[i],
						tract.rest_diameter[i] * (1.0 - factor) + constriction_diam * factor,
					)
				}
			}
		}
	}

	// Check for velum (nasal) touch
	if index >= f64(NOSE_START) && index < f64(NOSE_START + 10) && diameter > 2.0 {
		tract.velum_target = 0.4
	} else {
		tract.velum_target = 0.01
	}
}

handle_glottis_input :: proc(glottis: ^Glottis) {
	mx := f64(rl.GetMouseX())
	my := f64(rl.GetMouseY())

	keyboard_width :: 600
	keyboard_height :: 100

	// Check if in keyboard area
	if my >= f64(KEYBOARD_Y) &&
	   my < f64(KEYBOARD_Y) + f64(keyboard_height) &&
	   mx < f64(keyboard_width) {
		if rl.IsMouseButtonDown(.LEFT) {
			glottis.is_touched = true

			// Calculate pitch from x position (20 semitones across keyboard)
			semitone := 20.0 * mx / f64(keyboard_width)
			glottis.target_frequency = BASE_FREQUENCY * math.pow(2.0, semitone / 12.0)

			// Calculate tenseness from y position
			t := (my - f64(KEYBOARD_Y)) / f64(keyboard_height)
			t = 1.0 - clamp(t, 0.0, 1.0)
			glottis.target_tenseness = 1.0 - math.cos(t * math.PI * 0.5)
		} else {
			glottis.is_touched = false
		}
	} else {
		if !rl.IsMouseButtonDown(.LEFT) {
			glottis.is_touched = false
		}
	}
}
