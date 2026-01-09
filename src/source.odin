package viardot

import "core:math"

PI :: math.PI
TAU :: math.TAU

// Waveform generator functions

sine_wave :: proc(t: f64, frequency: f64) -> f64 {
	return math.sin(t * frequency * TAU)
}

square_wave :: proc(t: f64, frequency: f64) -> f64 {
	if math.sign(math.sin(t * frequency * TAU)) >= 0 {
		return 1.0
	}
	return -1.0
}

sawtooth_wave :: proc(t: f64, frequency: f64) -> f64 {
	t_factor := t * frequency
	return t_factor - math.floor(t_factor) - 0.5
}

triangle_wave :: proc(t: f64, frequency: f64) -> f64 {
	return (abs(sawtooth_wave(t, frequency)) - 0.25) * 4.0
}

tangent_wave :: proc(t: f64, frequency: f64) -> f64 {
	return clamp(math.tan((t * frequency * PI) - 0.5) / 4.0, -1.0, 1.0)
}

// Bell with harmonics and envelope
bell :: proc(t: f64, frequency: f64, attack: f64, decay: f64) -> f64 {
	// Frequency ratio, amplitude, decay multiplier
	Harmonic :: struct {
		freq_ratio: f64,
		amplitude:  f64,
		decay_mult: f64,
	}

	harmonics := [9]Harmonic {
		{0.56, 1.5, 1.0},
		{0.92, 0.5, 2.0},
		{1.19, 0.25, 4.0},
		{1.71, 0.125, 6.0},
		{2.00, 0.0625, 8.4},
		{2.74, 0.03125, 10.8},
		{3.00, 0.015625, 13.6},
		{3.76, 0.0078125, 16.4},
		{4.07, 0.00390625, 19.6},
	}

	acc: f64 = 0.0
	for h in harmonics {
		acc +=
			sine_wave(t, frequency * h.freq_ratio) *
			h.amplitude *
			envelope(t, attack, decay * h.decay_mult)
	}
	return acc / 2.0
}

organ :: proc(t: f64, frequency: f64) -> f64 {
	frequency_2 := (frequency / 2.0) * 3.0
	return sine_wave(t, frequency) + 0.2 * sine_wave(t, frequency_2)
}

// Liljencrants-Fant glottal waveform model
// Returns a function-like struct that can compute the waveform at any time t
Liljencrants_Fant :: struct {
	epsilon: f64,
	shift:   f64,
	delta:   f64,
	omega:   f64,
	alpha:   f64,
	e0:      f64,
	te:      f64,
}

liljencrants_fant_init :: proc(tenseness: f64) -> Liljencrants_Fant {
	// convert tenseness to rd variable
	rd := 0.5 + 2.2 * (1.0 - tenseness) // must be in range: [.5, 2.7]

	// normalized to time = 1, Ee = 1
	ra := -0.01 + 0.048 * rd
	rk := 0.224 + 0.118 * rd
	rg := (rk / 4.0) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk))

	// Timing parameters
	ta := ra
	tp := 1.0 / (2.0 * rg) // instant of maximum glottal flow
	te := tp + tp * rk

	epsilon := 1.0 / ta
	shift := math.exp(-epsilon * (1.0 - te))
	delta := 1.0 - shift

	rhs_integral := ((1.0 / epsilon) * (shift - 1.0) + (1.0 - te) * shift) / delta
	total_lower_integral := -(te - tp) / 2.0 + rhs_integral
	total_upper_integral := -total_lower_integral

	omega := PI / tp
	sine := math.sin(omega * te)

	y := -PI * sine * total_upper_integral / (tp * 2.0)
	z := math.ln(y)
	alpha := z / (tp / 2.0 - te)
	e0 := -1.0 / (sine * math.exp(alpha * te))

	return Liljencrants_Fant {
		epsilon = epsilon,
		shift = shift,
		delta = delta,
		omega = omega,
		alpha = alpha,
		e0 = e0,
		te = te,
	}
}

liljencrants_fant_sample :: proc(lf: ^Liljencrants_Fant, t: f64) -> f64 {
	if t > lf.te {
		return (-math.exp(-lf.epsilon * (t - lf.te)) + lf.shift) / lf.delta
	}
	return lf.e0 * math.exp(lf.alpha * t) * math.sin(lf.omega * t)
}

// Simple linear attack/decay envelope
envelope :: proc(relative_t, attack, decay: f64) -> f64 {
	if relative_t < 0.0 {
		return 0.0
	} else if relative_t < attack {
		return relative_t / attack
	} else if relative_t < attack + decay {
		return 1.0 - (relative_t - attack) / decay
	}
	return 0.0
}
