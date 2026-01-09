package trombone

import "base:runtime"
import "core:math/rand"
import rl "vendor:raylib"

WINDOW_WIDTH :: 800
WINDOW_HEIGHT :: 720
SAMPLE_RATE :: 44100

// ============================================================================
// Audio System
// ============================================================================

Audio_Context :: struct {
	glottis:      ^Glottis,
	tract:        ^Tract,
	time:         f64,
	sample_count: int,
}

audio_callback :: proc "c" (buffer_data: rawptr, frames: u32) {
	context = runtime.default_context()

	if g_audio_ctx == nil {
		return
	}

	out := ([^]f32)(buffer_data)
	ctx := g_audio_ctx

	block_size := 512

	for i in 0 ..< int(frames) {
		lambda := f64(ctx.sample_count % block_size) / f64(block_size)

		// Generate audio
		glottal := glottis_step(ctx.glottis, ctx.time, lambda)
		turbulence := (rand.float64() * 2.0 - 1.0) * 0.1
		vocal := tract_process(ctx.tract, glottal, turbulence, lambda)

		// Output: mix tract output with direct glottal
		sample := vocal + glottal * 0.3

		// Clamp and output
		out[i] = f32(clamp(sample * 0.6, -0.95, 0.95))

		ctx.time += 1 / SAMPLE_RATE
		ctx.sample_count += 1

		// End of block - update tract shape
		if ctx.sample_count % block_size == 0 {
			tract_finish_block(ctx.tract)
		}
	}
}

@(private = "file")
g_audio_ctx: ^Audio_Context

// ============================================================================
// Main
// ============================================================================

main :: proc() {
	// Initialize raylib
	rl.SetConfigFlags({.WINDOW_RESIZABLE})
	rl.InitWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "Pink Trombone - Vocal Tract Simulator")
	rl.SetTargetFPS(60)

	// Initialize raylib audio
	rl.InitAudioDevice()
	defer rl.CloseAudioDevice()

	// Initialize synthesis components
	glottis := glottis_new()
	tract := tract_new()
	defer tract_destroy(&tract)

	tract_set_rest_diameter(&tract)

	// Set up audio context
	audio_ctx := Audio_Context {
		glottis      = &glottis,
		tract        = &tract,
		time         = 0,
		sample_count = 0,
	}
	g_audio_ctx = &audio_ctx

	// Create audio stream
	stream := rl.LoadAudioStream(SAMPLE_RATE, 32, 1) // 44100Hz, 32-bit float, mono
	rl.SetAudioStreamCallback(stream, audio_callback)
	rl.PlayAudioStream(stream)
	defer rl.UnloadAudioStream(stream)

	// Main loop
	for !rl.WindowShouldClose() {
		// Handle input
		handle_tract_input(&tract, &glottis)
		handle_glottis_input(&glottis)

		// Draw
		rl.BeginDrawing()
		rl.ClearBackground(COLOR_BG)

		draw_tract(&tract)
		draw_glottis_ui(&glottis)
		draw_instructions()

		rl.EndDrawing()
	}

	rl.CloseWindow()
}
