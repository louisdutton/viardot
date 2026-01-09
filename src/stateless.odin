package viardot

import "core:math"

// Creates a low-pass filter. Frequencies below the cutoff are preserved when
// samples are convolved with this filter.
lowpass_filter :: proc(cutoff: f64, band: f64, allocator := context.allocator) -> [dynamic]f64 {
	n_raw := math.ceil(4.0 / band)
	n := int(n_raw)
	if n % 2 == 1 {
		n += 1
	}

	sinc :: proc(x: f64) -> f64 {
		if x == 0.0 {
			return 1.0
		}
		return math.sin(x * PI) / (x * PI)
	}

	sinc_wave := make([dynamic]f64, n, allocator)
	for i in 0 ..< n {
		sinc_wave[i] = sinc(2.0 * cutoff * (f64(i) - (f64(n) - 1.0) / 2.0))
	}

	blackman := blackman_window(n, allocator)
	defer delete(blackman)

	filter := make([dynamic]f64, n, allocator)
	sum: f64 = 0.0
	for i in 0 ..< n {
		filter[i] = sinc_wave[i] * blackman[i]
		sum += filter[i]
	}
	delete(sinc_wave)

	// Normalize
	for i in 0 ..< n {
		filter[i] /= sum
	}

	return filter
}

// Creates a Blackman window filter of a given size.
blackman_window :: proc(size: int, allocator := context.allocator) -> [dynamic]f64 {
	result := make([dynamic]f64, size, allocator)
	for i in 0 ..< size {
		result[i] =
			0.42 -
			0.5 * math.cos(2.0 * PI * f64(i) / (f64(size) - 1.0)) +
			0.08 * math.cos(4.0 * PI * f64(i) / (f64(size) - 1.0))
	}
	return result
}

// Creates a high-pass filter. Frequencies above the cutoff are preserved when
// samples are convolved with this filter.
highpass_filter :: proc(cutoff: f64, band: f64, allocator := context.allocator) -> [dynamic]f64 {
	lowpass := lowpass_filter(cutoff, band, allocator)
	defer delete(lowpass)
	return spectral_invert(lowpass[:], allocator)
}

// Creates a bandpass filter. Frequencies between low_frequency and high_frequency
// are preserved when samples are convolved with this filter.
bandpass_filter :: proc(
	low_frequency: f64,
	high_frequency: f64,
	band: f64,
	allocator := context.allocator,
) -> [dynamic]f64 {
	assert(low_frequency <= high_frequency)
	lowpass := lowpass_filter(high_frequency, band, allocator)
	defer delete(lowpass)
	highpass := highpass_filter(low_frequency, band, allocator)
	defer delete(highpass)
	return convolve(highpass[:], lowpass[:], allocator)
}

// Creates a bandreject filter. Frequencies outside of low_frequency and high_frequency
// are preserved when samples are convolved with this filter.
bandreject_filter :: proc(
	low_frequency: f64,
	high_frequency: f64,
	band: f64,
	allocator := context.allocator,
) -> [dynamic]f64 {
	assert(low_frequency <= high_frequency)
	lowpass := lowpass_filter(low_frequency, band, allocator)
	defer delete(lowpass)
	highpass := highpass_filter(high_frequency, band, allocator)
	defer delete(highpass)
	return filter_add(highpass[:], lowpass[:], allocator)
}

// Given a filter, inverts it.
spectral_invert :: proc(filter: []f64, allocator := context.allocator) -> [dynamic]f64 {
	assert(len(filter) % 2 == 0)
	result := make([dynamic]f64, len(filter), allocator)
	mid := len(filter) / 2
	for i in 0 ..< len(filter) {
		add: f64 = 1.0 if i == mid else 0.0
		result[i] = -filter[i] + add
	}
	return result
}

convolve :: proc(filter: []f64, input: []f64, allocator := context.allocator) -> [dynamic]f64 {
	output := make([dynamic]f64, allocator)
	h_len := int(len(filter) / 2)

	for i := -int(len(filter) / 2); i < int(len(input)) - 1; i += 1 {
		append(&output, 0.0)
		for j in 0 ..< int(len(filter)) {
			input_idx := i + j
			output_idx := i + h_len
			if input_idx < 0 || input_idx >= int(len(input)) {
				continue
			}
			output[output_idx] += input[input_idx] * filter[j]
		}
	}

	return output
}

// Performs elementwise addition of two slices.
filter_add :: proc(left: []f64, right: []f64, allocator := context.allocator) -> [dynamic]f64 {
	min_len := min(len(left), len(right))
	result := make([dynamic]f64, min_len, allocator)
	for i in 0 ..< min_len {
		result[i] = left[i] + right[i]
	}
	return result
}

// Returns the cutoff fraction for a given cutoff frequency at a sample rate.
cutoff_from_frequency :: proc(frequency: f64, sample_rate: uint) -> f64 {
	return frequency / f64(sample_rate)
}
