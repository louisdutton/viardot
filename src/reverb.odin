package viardot

// A simple reverb implementation using multiple delay lines and feedback
Reverb :: struct {
	delay_lines: [8]Reverb_Delay_Line,
	wet_level:   f64,
	dry_level:   f64,
}

@(private = "file")
Reverb_Delay_Line :: struct {
	buffer:        [dynamic]f64,
	write_index:   uint,
	delay_samples: uint,
	feedback:      f64,
	damping:       f64,
	filter_state:  f64,
}

@(private = "file")
reverb_delay_line_new :: proc(
	delay_samples: uint,
	feedback: f64,
	damping: f64,
	allocator := context.allocator,
) -> Reverb_Delay_Line {
	buffer := make([dynamic]f64, delay_samples, allocator)
	for i in 0 ..< delay_samples {
		buffer[i] = 0.0
	}
	return Reverb_Delay_Line {
		buffer = buffer,
		write_index = 0,
		delay_samples = delay_samples,
		feedback = feedback,
		damping = damping,
		filter_state = 0.0,
	}
}

@(private = "file")
reverb_delay_line_destroy :: proc(dl: ^Reverb_Delay_Line) {
	delete(dl.buffer)
}

@(private = "file")
reverb_delay_line_process :: proc(dl: ^Reverb_Delay_Line, input: f64) -> f64 {
	// Get delayed sample (read from current position)
	read_index := dl.write_index
	delayed := dl.buffer[read_index]

	// Apply simple lowpass filter for damping
	dl.filter_state = dl.filter_state * (1.0 - dl.damping) + delayed * dl.damping
	filtered := dl.filter_state

	// Add input + feedback to buffer
	feedback_sample := input + filtered * dl.feedback
	dl.buffer[dl.write_index] = feedback_sample

	// Advance write index
	dl.write_index = (dl.write_index + 1) % dl.delay_samples

	return delayed
}

// Creates a new reverb with reasonable default parameters
reverb_new :: proc(sample_rate: uint, allocator := context.allocator) -> Reverb {
	delay_times_ms := [8]f64{29.7, 37.1, 41.1, 43.7, 47.0, 50.0, 53.2, 56.3}
	delay_lines: [8]Reverb_Delay_Line

	for i in 0 ..< 8 {
		delay_samples := uint((delay_times_ms[i] / 1000.0) * f64(sample_rate))
		if delay_samples == 0 {
			delay_samples = 1
		}
		delay_lines[i] = reverb_delay_line_new(delay_samples, 0.5, 0.2, allocator)
	}

	return Reverb{delay_lines = delay_lines, wet_level = 0.3, dry_level = 0.7}
}

// Creates a reverb with custom parameters
reverb_with_params :: proc(
	sample_rate: uint,
	wet_level: f64,
	dry_level: f64,
	room_size: f64,
	allocator := context.allocator,
) -> Reverb {
	base_delay_times := [8]f64{29.7, 37.1, 41.1, 43.7, 47.0, 50.0, 53.2, 56.3}
	delay_lines: [8]Reverb_Delay_Line

	for i in 0 ..< 8 {
		scaled_delay := base_delay_times[i] * room_size
		delay_samples := uint((scaled_delay / 1000.0) * f64(sample_rate))
		if delay_samples == 0 {
			delay_samples = 1
		}
		feedback := 0.4 + room_size * 0.3
		damping := 0.1 + (1.0 - room_size) * 0.3
		delay_lines[i] = reverb_delay_line_new(delay_samples, feedback, damping, allocator)
	}

	return Reverb{delay_lines = delay_lines, wet_level = wet_level, dry_level = dry_level}
}

reverb_destroy :: proc(r: ^Reverb) {
	for i in 0 ..< 8 {
		reverb_delay_line_destroy(&r.delay_lines[i])
	}
}

// Process a single sample through the reverb
reverb_process :: proc(r: ^Reverb, input: f64) -> f64 {
	wet_output: f64 = 0.0

	// Sum outputs from all delay lines
	for i in 0 ..< 8 {
		wet_output += reverb_delay_line_process(&r.delay_lines[i], input)
	}

	// Average the delay line outputs
	wet_output /= 8.0

	// Mix dry and wet signals
	return input * r.dry_level + wet_output * r.wet_level
}

// Set the wet/dry mix (0.0 = all dry, 1.0 = all wet)
reverb_set_wet_level :: proc(r: ^Reverb, wet_level: f64) {
	r.wet_level = clamp(wet_level, 0.0, 1.0)
	r.dry_level = 1.0 - r.wet_level
}
