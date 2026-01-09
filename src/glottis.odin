package viardot

import "core:math"

ASPIRATION_BUFFER_SIZE :: 128
NOISE_SIMPLEX_AMPLITUDE :: 0.25
NOISE_HANNING_FLOOR :: 0.15
NOISE_HANNING_AMPLITUDE :: 0.8

Oscillation :: struct {
	frequency: f64, // frequency in hertz
	amplitude: f64, // amplitude in range 0..1
}

Glottis :: struct {
	frequency:         f64,
	tenseness:         f64,
	vibrato:           Oscillation,
	intensity:         f64,
	loudness:          f64,
	wave_function:     Liljencrants_Fant,
	aspiration_buffer: [ASPIRATION_BUFFER_SIZE]f64,
	aspiration_index:  uint,
}

glottis_new :: proc() -> Glottis {
	tenseness: f64 = 0.5
	vibrato := Oscillation {
		frequency = 6.0,
		amplitude = 0.1,
	}

	aspiration_buffer: [ASPIRATION_BUFFER_SIZE]f64
	for i in 0 ..< ASPIRATION_BUFFER_SIZE {
		aspiration_buffer[i] = gaussian()
	}

	return Glottis {
		tenseness         = tenseness,
		vibrato           = vibrato,
		frequency         = 440.0, // A4
		intensity         = 0.5,
		loudness          = 0.1,
		wave_function     = liljencrants_fant_init(tenseness),
		aspiration_buffer = aspiration_buffer,
		aspiration_index  = 0,
	}
}

// Generates glottal excitation at a given time.
glottis_process :: proc(g: ^Glottis, time: f64) -> f64 {
	s1 := simplex(f64(g.aspiration_index))

	// vibrato
	vibrato :=
		math.sin(g.vibrato.frequency * TAU * time) * g.vibrato.amplitude +
		(s1 * g.vibrato.amplitude * 0.5)

	// excitation
	f0 := g.frequency + vibrato
	t := math.mod(time * f0, 1.0)
	excitation := liljencrants_fant_sample(&g.wave_function, t)

	// aspiration (gaussian buffer = aspiration)
	aspiration := g.aspiration_buffer[g.aspiration_index]
	modulation := hanning_modulation(t, NOISE_HANNING_FLOOR, NOISE_HANNING_AMPLITUDE)
	noise_residual :=
		aspiration * (1.0 + s1 * NOISE_SIMPLEX_AMPLITUDE) * modulation * math.sqrt(g.tenseness)
	g.aspiration_index = (g.aspiration_index + 1) % ASPIRATION_BUFFER_SIZE

	return excitation * g.intensity * g.loudness + noise_residual
}

// Returns a hanning-window amplitude modulation value at point t for a given frequency.
@(private = "file")
hanning_modulation :: proc(t: f64, floor: f64, amplitude: f64) -> f64 {
	return floor + amplitude * ((1.0 - math.cos(TAU * t)) / 2.0)
}
