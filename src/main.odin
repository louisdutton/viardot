package viardot

import "core:fmt"
import "core:math"
import "playback"

CHANNELS :: 1
BIT_DEPTH :: 32
SAMPLE_RATE :: 44100
BUFFER_SIZE :: 2048

Voice :: struct {
	i:           uint,
	sample_rate: uint,
	glottis:     Glottis,
	tract:       Tract,
	reverb:      Reverb,
	frequency:   f32,
}

voice_new :: proc(sample_rate: uint) -> Voice {
	reverb := reverb_new(sample_rate)
	reverb_set_wet_level(&reverb, 0.9)

	return {
		i = 0,
		sample_rate = sample_rate,
		glottis = glottis_new(),
		tract = tract_new(46, 32),
		reverb = reverb,
		frequency = 220.0,
	}
}

voice_destroy :: proc(v: ^Voice) {
	tract_destroy(&v.tract)
	reverb_destroy(&v.reverb)
}

voice_generate :: proc(v: ^Voice) -> f32 {
	t := f32(v.i) / f32(v.sample_rate)
	v.i += 1

	// v.glottis.frequency = v.frequency
	// glottal_output := glottis_process(&v.glottis, t)
	// tract_output := tract_process(&v.tract, glottal_output, 0.0)
	// reverb_output := reverb_process(&v.reverb, tract_output)

	return math.sin(t)
}


main :: proc() {
	voice := voice_new(SAMPLE_RATE)
	samples: [BUFFER_SIZE]f32

	for i in 0 ..< BUFFER_SIZE {
		samples[i] = voice_generate(&voice)
	}

	playback.play_samples(samples[:], SAMPLE_RATE, CHANNELS)
}
