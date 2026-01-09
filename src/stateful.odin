package viardot

// A stateful delay line. Samples are delayed for delay_length seconds.
Delay_Line :: struct {
	buf:           [dynamic]f64,
	index:         uint,
	delay_length:  f64,
	delay_samples: uint,
	sample_rate:   uint,
}

delay_line_new :: proc(
	delay_length: f64,
	sample_rate: uint,
	allocator := context.allocator,
) -> Delay_Line {
	delay_samples := uint((delay_length * f64(sample_rate)) + 1.0)

	buf := make([dynamic]f64, delay_samples, allocator)
	for i in 0 ..< delay_samples {
		buf[i] = 0.0
	}

	return Delay_Line {
		buf = buf,
		index = 0,
		delay_length = delay_length,
		delay_samples = delay_samples,
		sample_rate = sample_rate,
	}
}

delay_line_destroy :: proc(dl: ^Delay_Line) {
	delete(dl.buf)
}

delay_line_read :: proc(dl: ^Delay_Line) -> f64 {
	return dl.buf[dl.index]
}

delay_line_write :: proc(dl: ^Delay_Line, value: f64) {
	dl.buf[dl.index] = value
	if dl.index == uint(len(dl.buf)) - 1 {
		dl.index = 0
	} else {
		dl.index += 1
	}
}

// A stateful all-pass filter.
All_Pass :: struct {
	delay_line: Delay_Line,
	feedback:   f64, // Feedback multiplier (0.5 works)
}

all_pass_new :: proc(
	delay_length: f64,
	sample_rate: uint,
	feedback: f64,
	allocator := context.allocator,
) -> All_Pass {
	return All_Pass {
		delay_line = delay_line_new(delay_length, sample_rate, allocator),
		feedback = feedback,
	}
}

all_pass_destroy :: proc(ap: ^All_Pass) {
	delay_line_destroy(&ap.delay_line)
}

all_pass_tick :: proc(ap: ^All_Pass, input: f64) -> f64 {
	delayed := delay_line_read(&ap.delay_line)
	delay_line_write(&ap.delay_line, input + delayed * ap.feedback)
	return -input + delayed
}

// A stateful comb filter.
Comb :: struct {
	delay_line:        Delay_Line,
	filter_state:      f64,
	dampening_inverse: f64, // 0.5 works
	dampening:         f64, // 0.5 works
	feedback:          f64, // 0.5 works
}

comb_new :: proc(
	delay_length: f64,
	sample_rate: uint,
	dampening_inverse: f64,
	dampening: f64,
	feedback: f64,
	allocator := context.allocator,
) -> Comb {
	return {
		delay_line = delay_line_new(delay_length, sample_rate, allocator),
		filter_state = 0.0,
		dampening_inverse = dampening_inverse,
		dampening = dampening,
		feedback = feedback,
	}
}

comb_destroy :: proc(c: ^Comb) {
	delay_line_destroy(&c.delay_line)
}

comb_tick :: proc(c: ^Comb, input: f64) -> f64 {
	output := delay_line_read(&c.delay_line)
	c.filter_state = output * c.dampening_inverse + c.filter_state * c.dampening
	delay_line_write(&c.delay_line, input + c.filter_state * c.feedback)
	return output
}
