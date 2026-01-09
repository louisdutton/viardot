package trombone

import "core:math"
import "core:math/rand"

F2 :: 87.3071
BASE_FREQUENCY :: F2

// The opening between the vocal folds
Glottis :: struct {
	frequency:        f64,
	target_frequency: f64,
	tenseness:        f64,
	target_tenseness: f64,
	intensity:        f64,
	loudness:         f64,
	vibrato_amount:   f64,
	vibrato_freq:     f64,
	time_in_waveform: f64,
	waveform_length:  f64,
	// LF waveform parameters
	alpha:            f64,
	e0:               f64,
	epsilon:          f64,
	shift:            f64,
	delta:            f64,
	te:               f64,
	omega:            f64,
	// Noise
	noise_time:       f64,
	is_touched:       bool,
}

glottis_new :: proc() -> (g: Glottis) {
	g.frequency = 140
	g.target_frequency = g.frequency
	g.tenseness = 0.6
	g.target_tenseness = g.tenseness
	g.intensity = 0
	g.loudness = 1
	g.vibrato_amount = 0.005
	g.vibrato_freq = 6
	g.time_in_waveform = 0
	g.waveform_length = 1 / g.frequency
	g.noise_time = 0
	g.is_touched = false

	glottis_setup_waveform(&g, 0)
	return g
}

glottis_setup_waveform :: proc(g: ^Glottis, lambda: f64) {
	// Interpolate frequency and tenseness
	g.frequency = g.frequency * (1.0 - lambda) + g.target_frequency * lambda
	g.tenseness = g.tenseness * (1.0 - lambda) + g.target_tenseness * lambda

	// Calculate waveform length
	g.waveform_length = 1.0 / g.frequency

	// LF model parameters based on tenseness
	rd := clamp(3.0 * (1.0 - g.tenseness), 0.5, 2.7)

	ra := -0.01 + 0.048 * rd
	rk := 0.224 + 0.118 * rd
	rg := (rk / 4) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk))

	ta := ra
	tp := 1 / (2 * rg)
	te := tp + tp * rk

	g.epsilon = 1 / ta
	g.shift = math.exp(-g.epsilon * (1 - te))
	g.delta = 1 - g.shift

	rhs_integral := ((1 / g.epsilon) * (g.shift - 1) + (1 - te) * g.shift) / g.delta
	total_lower := -(te - tp) / 2 + rhs_integral
	total_upper := -total_lower

	g.omega = math.PI / tp
	sine := math.sin(g.omega * te)

	y := -math.PI * sine * total_upper / (tp * 2)
	z := math.ln(y)
	g.alpha = z / (tp / 2 - te)
	g.e0 = -1 / (sine * math.exp(g.alpha * te))
	g.te = te
}

glottis_noise_modulator :: proc(g: ^Glottis) -> f64 {
	voiced := 0.1 + 0.2 * max(0.0, math.sin(math.TAU * g.time_in_waveform / g.waveform_length))
	return g.tenseness * g.intensity * voiced + (1 - g.tenseness * g.intensity) * 0.3
}

glottis_step :: proc(g: ^Glottis, time: f64, lambda: f64) -> f64 {
	time_step := 1.0 / f64(SAMPLE_RATE)
	g.time_in_waveform += time_step

	if g.time_in_waveform > g.waveform_length {
		g.time_in_waveform -= g.waveform_length
		glottis_setup_waveform(g, lambda)
	}

	// Add vibrato
	vibrato := g.vibrato_amount * math.sin(math.TAU * time * g.vibrato_freq)
	vibrato += 0.02 * simplex_noise(time * 4.07)
	vibrato += 0.04 * simplex_noise(time * 2.15)

	// Intensity control - fast attack, slower release
	if g.is_touched {
		g.intensity = move_towards(g.intensity, 1, 0.1)
	} else {
		g.intensity = move_towards(g.intensity, 0, 0.02)
	}

	// Calculate output with vibrato
	t := (g.time_in_waveform / g.waveform_length) * (1 + vibrato)
	t = clamp(t, 0, 1)

	out: f64
	if t > g.te {
		out = (-math.exp(-g.epsilon * (t - g.te)) + g.shift) / g.delta
	} else {
		out = g.e0 * math.exp(g.alpha * t) * math.sin(g.omega * t)
	}

	// Add aspiration noise
	aspiration := g.intensity * (1.0 - math.sqrt(g.tenseness)) * glottis_noise_modulator(g)
	aspiration *= 0.2 + 0.02 * simplex_noise(time * 1.99)
	noise := (rand.float64() * 2.0 - 1.0) * aspiration

	return out * g.intensity * g.loudness + noise
}
