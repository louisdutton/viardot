package playback

import "base:runtime"
import "core:fmt"
import "core:time"
import ma "vendor:miniaudio"

Playback_Context :: struct {
	samples:  []f32,
	position: int,
}

audio_callback :: proc "c" (device: ^ma.device, output: rawptr, input: rawptr, frame_count: u32) {
	context = runtime.default_context()

	ctx := cast(^Playback_Context)device.pUserData
	if ctx == nil || ctx.position >= len(ctx.samples) {
		return
	}

	out := ([^]f32)(output)
	frames_to_copy := min(int(frame_count), len(ctx.samples) - ctx.position)

	for i in 0 ..< frames_to_copy {
		out[i] = ctx.samples[ctx.position + i]
	}

	ctx.position += frames_to_copy
}

play_samples :: proc(samples: []f32, channels, sample_rate: int) {
	playback_ctx := Playback_Context {
		samples  = samples,
		position = 0,
	}

	device_config := ma.device_config_init(.playback)
	device_config.playback.format = .f32
	device_config.playback.channels = u32(channels)
	device_config.sampleRate = u32(sample_rate)
	device_config.dataCallback = audio_callback
	device_config.pUserData = &playback_ctx

	device: ma.device
	if res := ma.device_init(nil, &device_config, &device); res != .SUCCESS {
		fmt.println("Failed to initialize audio device", res)
		return
	}
	defer ma.device_uninit(&device)

	if ma.device_start(&device) != .SUCCESS {
		fmt.println("Failed to start audio device")
		return
	}

	for playback_ctx.position < len(samples) {
		time.sleep(10 * time.Millisecond)
	}
}
