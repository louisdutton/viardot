package trombone

import "core:math"
import rl "vendor:raylib"

// Colors
COLOR_PINK := rl.Color{255, 192, 203, 255}
COLOR_PALE_PINK := rl.Color{255, 228, 225, 255}
COLOR_ORCHID := rl.Color{218, 112, 214, 255}
COLOR_DARK_ORCHID := rl.Color{153, 50, 204, 255}
COLOR_BG := rl.Color{255, 255, 255, 255} // White background like original

// Origin is center of the arc, tract curves from throat (bottom-left) to lips (right)
TRACT_ORIGIN_X :: 280
TRACT_ORIGIN_Y :: 400
TRACT_RADIUS :: 260
KEYBOARD_Y :: 600
KEYBOARD_HEIGHT :: 120

// ============================================================================
// UI Drawing
// ============================================================================

// Helper to get polar coordinates for tract position
// index: 0 = glottis/throat, LIP_START-1 = lips
// diameter: positive = outer (palate/top side), negative = inner (tongue/bottom side)
// The tract curves from bottom-left (throat) counterclockwise to right-bottom (lips)
get_tract_polar :: proc(index: f32, diameter: f32, scale: f32 = 25.0) -> (x: f32, y: f32) {
	// Angle in standard math coords (0 = right, PI/2 = up, PI = left, 3PI/2 = down)
	// Throat at bottom-left (~225 deg = 1.25*PI), lips at right-down (~-20 deg = -0.11*PI)
	ANGLE_START :: math.PI * 1.1 // ~200 degrees - lower left
	ANGLE_END :: math.PI * -0.15 // ~-27 degrees - right, slightly below horizontal
	ANGLE_RANGE :: ANGLE_START - ANGLE_END

	t := index / f32(LIP_START - 1) // 0 to 1 along tract
	angle := ANGLE_START - t * ANGLE_RANGE

	r := f32(TRACT_RADIUS) + diameter * scale
	x = f32(TRACT_ORIGIN_X) + math.cos(angle) * r
	y = f32(TRACT_ORIGIN_Y) - math.sin(angle) * r
	return
}

draw_tract :: proc(tract: ^Tract) {
	draw_oral_cavity_fill(tract)
	draw_nasal_cavity(tract)
	draw_tract_segments(tract)
	draw_tract_walls(tract)
	draw_tongue_control(tract)
	draw_tract_labels(tract)
}

draw_oral_cavity_fill :: proc(tract: ^Tract) {
	// Fill the oral cavity with pink color using triangles
	for i in 0 ..< TRACT_N - 1 {
		// Inner wall points (tongue side - negative diameter = closer to center)
		ix1, iy1 := get_tract_polar(f32(i), -tract.diameter[i])
		ix2, iy2 := get_tract_polar(f32(i + 1), -tract.diameter[i + 1])
		// Outer wall points (palate side - positive diameter = further from center)
		ox1, oy1 := get_tract_polar(f32(i), tract.diameter[i])
		ox2, oy2 := get_tract_polar(f32(i + 1), tract.diameter[i + 1])

		// Draw two triangles to fill the quad (counter-clockwise winding for raylib)
		rl.DrawTriangle(
			{f32(ox1), f32(oy1)},
			{f32(ix1), f32(iy1)},
			{f32(ix2), f32(iy2)},
			COLOR_PALE_PINK,
		)
		rl.DrawTriangle(
			{f32(ox1), f32(oy1)},
			{f32(ix2), f32(iy2)},
			{f32(ox2), f32(oy2)},
			COLOR_PALE_PINK,
		)
	}
}

draw_tract_segments :: proc(tract: ^Tract) {
	// Draw radial lines for each segment (like in Pink Trombone)
	for i in 0 ..< TRACT_N {
		// Inner point
		ix, iy := get_tract_polar(f32(i), -tract.diameter[i])
		// Outer point
		ox, oy := get_tract_polar(f32(i), tract.diameter[i])

		// Color varies by region
		color: rl.Color
		if i < BLADE_START {
			// Throat/soft palate region - lighter lines
			color = rl.Color{200, 150, 180, 80}
		} else if i < TIP_START {
			// Hard palate region - medium lines
			color = rl.Color{200, 150, 180, 100}
		} else {
			// Lip region - darker lines
			color = rl.Color{200, 150, 180, 120}
		}

		rl.DrawLineEx({f32(ix), f32(iy)}, {f32(ox), f32(oy)}, 1, color)
	}
}

draw_tract_walls :: proc(tract: ^Tract) {
	// Draw outer wall (hard/soft palate side)
	for i in 0 ..< TRACT_N - 1 {
		x1, y1 := get_tract_polar(f32(i), tract.diameter[i])
		x2, y2 := get_tract_polar(f32(i + 1), tract.diameter[i + 1])
		rl.DrawLineEx({f32(x1), f32(y1)}, {f32(x2), f32(y2)}, 5, COLOR_ORCHID)
	}

	// Draw inner wall (tongue side)
	for i in 0 ..< TRACT_N - 1 {
		x1, y1 := get_tract_polar(f32(i), -tract.diameter[i])
		x2, y2 := get_tract_polar(f32(i + 1), -tract.diameter[i + 1])
		rl.DrawLineEx({f32(x1), f32(y1)}, {f32(x2), f32(y2)}, 5, COLOR_ORCHID)
	}

	// Draw lip end cap
	lip_inner_x, lip_inner_y := get_tract_polar(f32(TRACT_N - 1), -tract.diameter[TRACT_N - 1])
	lip_outer_x, lip_outer_y := get_tract_polar(f32(TRACT_N - 1), tract.diameter[TRACT_N - 1])
	rl.DrawLineEx(
		{f32(lip_inner_x), f32(lip_inner_y)},
		{f32(lip_outer_x), f32(lip_outer_y)},
		5,
		COLOR_ORCHID,
	)

	// Draw throat end
	throat_inner_x, throat_inner_y := get_tract_polar(0, -tract.diameter[0])
	throat_outer_x, throat_outer_y := get_tract_polar(0, tract.diameter[0])
	rl.DrawLineEx(
		{f32(throat_inner_x), f32(throat_inner_y)},
		{f32(throat_outer_x), f32(throat_outer_y)},
		5,
		COLOR_ORCHID,
	)
}

draw_nasal_cavity :: proc(tract: ^Tract) {
	// Nasal cavity sits above (outside) the oral cavity, starting at NOSE_START
	NOSE_BASE :: 2.0 // Base offset from tract center (outside the oral cavity)

	// Fill nasal cavity
	for i in 0 ..< NASAL_N - 1 {
		// Map nasal index to tract position (nasal runs from NOSE_START toward lips)
		tract_idx := f32(NOSE_START) + f32(i) * f32(TRACT_N - NOSE_START - 5) / f32(NASAL_N)
		tract_idx_next :=
			f32(NOSE_START) + f32(i + 1) * f32(TRACT_N - NOSE_START - 5) / f32(NASAL_N)

		// Inner edge (closer to oral cavity - at the palate)
		INNER_D :: NOSE_BASE + 0.5
		ix1, iy1 := get_tract_polar(tract_idx, INNER_D)
		ix2, iy2 := get_tract_polar(tract_idx_next, INNER_D)

		// Outer edge (further from center)
		outer_d := INNER_D + tract.nose_diameter[i] * 0.6
		outer_d_next := INNER_D + tract.nose_diameter[i + 1] * 0.6
		ox1, oy1 := get_tract_polar(tract_idx, outer_d)
		ox2, oy2 := get_tract_polar(tract_idx_next, outer_d_next)

		// Fill with pink (counter-clockwise winding)
		rl.DrawTriangle({ox1, oy1}, {ix1, iy1}, {ix2, iy2}, COLOR_PINK)
		rl.DrawTriangle({ox1, oy1}, {ix2, iy2}, {ox2, oy2}, COLOR_PINK)
	}

	// Draw nasal cavity walls
	for i in 0 ..< NASAL_N - 1 {
		tract_idx := f32(NOSE_START) + f32(i) * f32(TRACT_N - NOSE_START - 5) / f32(NASAL_N)
		tract_idx_next :=
			f32(NOSE_START) + f32(i + 1) * f32(TRACT_N - NOSE_START - 5) / f32(NASAL_N)

		INNER_D :: NOSE_BASE + 0.5
		outer_d := INNER_D + tract.nose_diameter[i] * 0.6
		outer_d_next := INNER_D + tract.nose_diameter[i + 1] * 0.6

		// Outer wall
		ox1, oy1 := get_tract_polar(tract_idx, outer_d)
		ox2, oy2 := get_tract_polar(tract_idx_next, outer_d_next)
		rl.DrawLineEx({f32(ox1), f32(oy1)}, {f32(ox2), f32(oy2)}, 3, rl.Color{192, 100, 192, 200})

		// Inner wall
		ix1, iy1 := get_tract_polar(tract_idx, INNER_D)
		ix2, iy2 := get_tract_polar(tract_idx_next, INNER_D)
		rl.DrawLineEx({f32(ix1), f32(iy1)}, {f32(ix2), f32(iy2)}, 3, rl.Color{192, 100, 192, 200})
	}
}

draw_tract_labels :: proc(tract: ^Tract) {
	// Get positions along the tract for labels
	throat_x, throat_y := get_tract_polar(3, 0)
	soft_palate_x, soft_palate_y := get_tract_polar(10, 2.5)
	hard_palate_x, hard_palate_y := get_tract_polar(25, 2.5)
	oral_x, oral_y := get_tract_polar(22, 0)
	lip_outer_x, lip_outer_y := get_tract_polar(f32(LIP_START) + 2, 1.0)
	lip_inner_x, lip_inner_y := get_tract_polar(f32(LIP_START) + 2, -1.0)

	// Throat label
	rl.DrawText("throat", i32(throat_x) - 30, i32(throat_y) + 10, 14, rl.Color{200, 150, 200, 200})

	// Soft palate label
	rl.DrawText(
		"soft palate",
		i32(soft_palate_x) - 30,
		i32(soft_palate_y) - 20,
		14,
		rl.Color{200, 150, 200, 200},
	)

	// Hard palate label
	rl.DrawText(
		"hard palate",
		i32(hard_palate_x) - 40,
		i32(hard_palate_y) - 15,
		14,
		rl.Color{200, 150, 200, 200},
	)

	// Oral cavity label - in the center of the tract
	rl.DrawText("oral cavity", i32(oral_x) - 40, i32(oral_y) - 5, 16, rl.WHITE)

	// Nasal cavity label - above the oral tract
	nasal_x, nasal_y := get_tract_polar(22, 4.0)
	rl.DrawText("nasal", i32(nasal_x) - 20, i32(nasal_y) - 25, 16, rl.WHITE)
	rl.DrawText("cavity", i32(nasal_x) - 25, i32(nasal_y) - 5, 16, rl.WHITE)

	// Lip labels
	rl.DrawText(
		"lip",
		i32(lip_outer_x) + 5,
		i32(lip_outer_y) - 5,
		14,
		rl.Color{200, 150, 200, 200},
	)
	rl.DrawText(
		"lip",
		i32(lip_inner_x) + 5,
		i32(lip_inner_y) - 5,
		14,
		rl.Color{200, 150, 200, 200},
	)

	// Side labels for sound types (near lips on right side)
	rl.DrawText("nasals", 720, 150, 14, rl.Color{200, 150, 200, 200})
	rl.DrawText("stops", 720, 200, 14, rl.Color{200, 150, 200, 200})
	rl.DrawText("fricatives", 720, 250, 14, rl.Color{200, 150, 200, 200})
}

draw_tongue_control :: proc(tract: ^Tract) {
	// Tongue control is on the inner (tongue) side of the tract
	// In the original, it's a region where you can drag to shape vowels
	INNER_DIAM :: -2.05 // Closer to center (inside the tract)
	OUTER_DIAM :: -3.5 // Further inside

	// Draw the tongue control region background
	for i in BLADE_START + 2 ..< TIP_START - 3 {
		ix1, iy1 := get_tract_polar(f32(i), INNER_DIAM)
		ix2, iy2 := get_tract_polar(f32(i + 1), INNER_DIAM)
		ox1, oy1 := get_tract_polar(f32(i), OUTER_DIAM)
		ox2, oy2 := get_tract_polar(f32(i + 1), OUTER_DIAM)

		rl.DrawTriangle(
			{f32(ix1), f32(iy1)},
			{f32(ox1), f32(oy1)},
			{f32(ix2), f32(iy2)},
			rl.Color{255, 235, 245, 150},
		)
		rl.DrawTriangle(
			{f32(ix2), f32(iy2)},
			{f32(ox1), f32(oy1)},
			{f32(ox2), f32(oy2)},
			rl.Color{255, 235, 245, 150},
		)
	}

	// Draw control guide dots
	for j in 0 ..< 6 {
		idx := f32(BLADE_START + 2) + f32(j) * f32(TIP_START - BLADE_START - 5) / 5.0
		MID_DIAM :: (INNER_DIAM + OUTER_DIAM) / 2.0
		x, y := get_tract_polar(idx, MID_DIAM)
		rl.DrawCircle(i32(x), i32(y), 4, rl.Color{218, 112, 214, 100})
	}

	// Draw current tongue position indicator
	tongue_x, tongue_y := get_tract_polar(tract.tongue_index, -tract.tongue_diameter)
	rl.DrawCircle(i32(tongue_x), i32(tongue_y), 18, rl.Color{218, 112, 214, 180})
	rl.DrawCircleLines(i32(tongue_x), i32(tongue_y), 18, COLOR_ORCHID)

	// Label below the control area
	label_x, label_y := get_tract_polar(f32(BLADE_START + 12), -1.0)
	rl.DrawText(
		"tongue control",
		i32(label_x) - 50,
		i32(label_y) + 20,
		14,
		rl.Color{200, 150, 200, 200},
	)
}

draw_glottis_ui :: proc(glottis: ^Glottis) {
	keyboard_x :: 0
	keyboard_width :: 600
	keyboard_height :: 100

	// Draw keyboard background with rounded appearance
	rl.DrawRectangle(keyboard_x, i32(KEYBOARD_Y), keyboard_width, keyboard_height, COLOR_PALE_PINK)

	// Draw a slightly darker bar at bottom
	rl.DrawRectangle(
		keyboard_x,
		i32(KEYBOARD_Y) + keyboard_height,
		keyboard_width,
		30,
		rl.Color{255, 220, 230, 255},
	)

	// Draw semitone markers
	for i in 0 ..< 30 {
		x := keyboard_x + i32(f32(i) * f32(keyboard_width) / 30.0)
		line_height: i32 = keyboard_height + 30 if i % 12 == 0 else keyboard_height
		alpha: u8 = 150 if i % 12 == 0 else 80
		rl.DrawLine(
			x,
			i32(KEYBOARD_Y),
			x,
			i32(KEYBOARD_Y) + line_height,
			rl.Color{200, 150, 180, alpha},
		)
	}

	// Draw pitch indicator
	semitone := 12.0 * math.log2(glottis.frequency / BASE_FREQUENCY)
	pitch_x := keyboard_x + i32((semitone / 20.0) * f32(keyboard_width))
	pitch_y := i32(f32(KEYBOARD_Y) + f32(keyboard_height) * (1.0 - glottis.tenseness))

	// Pitch indicator rectangle
	rl.DrawRectangle(pitch_x - 9, pitch_y - 12, 18, 24, rl.Color{218, 112, 214, 100})
	rl.DrawRectangleLines(pitch_x - 9, pitch_y - 12, 18, 24, COLOR_ORCHID)

	// Labels
	rl.DrawText(
		"voicebox control",
		keyboard_x + 10,
		i32(KEYBOARD_Y) + keyboard_height + 5,
		16,
		COLOR_DARK_ORCHID,
	)

	// Pitch label with arrows at bottom
	pitch_label_y := i32(KEYBOARD_Y) + keyboard_height + 35
	center_x: i32 = keyboard_x + keyboard_width / 2
	rl.DrawText("<", center_x - 50, pitch_label_y, 16, COLOR_DARK_ORCHID)
	rl.DrawText("pitch", center_x - 20, pitch_label_y, 16, COLOR_DARK_ORCHID)
	rl.DrawText(">", center_x + 30, pitch_label_y, 16, COLOR_DARK_ORCHID)
}

draw_instructions :: proc() {
	// Minimal - original Pink Trombone doesn't have visible instructions
}
