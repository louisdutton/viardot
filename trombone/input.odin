package trombone

import "core:math"
import rl "vendor:raylib"

handle_tract_input :: proc(tract: ^Tract, glottis: ^Glottis) {
	if !rl.IsMouseButtonDown(.LEFT) {
		return
	}

	mx := f32(rl.GetMouseX())
	my := f32(rl.GetMouseY())

	// Check if in tract area (above keyboard)
	if my > KEYBOARD_Y {
		return
	}

	// Touching the tract also activates voice
	glottis.is_touched = true

	// Convert mouse to polar tract coordinates
	dx := mx - TRACT_ORIGIN_X
	dy := -(my - TRACT_ORIGIN_Y) // Flip Y for standard math coords

	angle := math.atan2(dy, dx)
	if angle < 0 {
		angle += 2.0 * math.PI
	}
	radius := math.sqrt(dx * dx + dy * dy)

	// Convert angle to tract index (inverse of drawing formula)
	ANGLE_START :: math.PI * 1.1
	ANGLE_END :: math.PI * -0.15
	ANGLE_RANGE :: ANGLE_START - ANGLE_END

	t := (ANGLE_START - angle) / ANGLE_RANGE
	index := t * f32(LIP_START - 1)

	// Convert radius to diameter
	diameter := (radius - TRACT_RADIUS) / 25.0

	// Check if in tongue control region (inner side, negative diameter)
	if index >= BLADE_START + 2 && index < TIP_START - 3 && diameter >= -3.5 && diameter <= -2.05 {
		tract.tongue_index = clamp(index, f32(BLADE_START + 2), f32(TIP_START - 3))
		tract.tongue_diameter = clamp(-diameter, 2.05, 3.5)
		tract_set_rest_diameter(tract)
	} else if index >= 0 && index < f32(TRACT_N) {
		idx := int(index)
		if idx >= 0 && idx < TRACT_N {
			tract_diam := tract.diameter[idx]
			if diameter >= -tract_diam && diameter <= tract_diam {
				constriction_diam := max(0, (diameter + tract_diam) / 2)
				for i in max(0, idx - 2) ..< min(TRACT_N, idx + 3) {
					dist := abs(f32(i) - index)
					factor := max(0, 1 - dist / 3)
					tract.target_diameter[i] = min(
						tract.target_diameter[i],
						tract.rest_diameter[i] * (1 - factor) + constriction_diam * factor,
					)
				}
			}
		}
	}

	// Check for velum (nasal) touch
	if index >= NOSE_START && index < NOSE_START + 10 && diameter > 2 {
		tract.velum_target = 0.4
	} else {
		tract.velum_target = 0.01
	}
}

handle_glottis_input :: proc(glottis: ^Glottis) {
	mx := f32(rl.GetMouseX())
	my := f32(rl.GetMouseY())

	KEYBOARD_WIDTH :: 600
	KEYBOARD_HEIGHT :: 100

	// Check if in keyboard area
	if my >= KEYBOARD_Y && my < KEYBOARD_Y + KEYBOARD_HEIGHT && mx < KEYBOARD_WIDTH {
		if rl.IsMouseButtonDown(.LEFT) {
			glottis.is_touched = true

			// Calculate pitch from x position (20 semitones across keyboard)
			semitone := 20.0 * mx / f32(KEYBOARD_WIDTH)
			glottis.target_frequency = BASE_FREQUENCY * math.pow(2.0, semitone / 12.0)

			// Calculate tenseness from y position
			t := (my - f32(KEYBOARD_Y)) / f32(KEYBOARD_HEIGHT)
			t = 1 - clamp(t, 0, 1)
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
