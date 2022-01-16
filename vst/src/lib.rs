#[macro_use]
extern crate vst;

use std::sync::Arc;
use vst::api::{Events, Supported};
use vst::buffer::AudioBuffer;
use vst::event::Event;
use vst::plugin::{CanDo, Category, HostCallback, Info, Plugin, PluginParameters};
use vst::util::AtomicFloat;

use std::f32::consts::PI;
pub const TAU: f32 = PI * 2.0;

// struct Parameters {
//     sample_rate: AtomicFloat,
// }

// impl Default for Parameters {
//     fn default() -> Parameters {
//         Parameters {
//             sample_rate: AtomicFloat::new(44100.),
//         }
//     }
// }

// impl PluginParameters for Parameters {
//     // get_parameter has to return the value used in set_parameter
//     fn get_parameter(&self, index: i32) -> f32 {
//         match index {
//             0 => self.get_cutoff(),
//             1 => self.res.get() / 4.,
//             2 => self.pole_value.get(),
//             3 => self.drive.get() / 5.,
//             _ => 0.0,
//         }
//     }

//     fn set_parameter(&self, index: i32, value: f32) {
//         match index {
//             0 => self.set_cutoff(value),
//             1 => self.res.set(value * 4.),
//             2 => self.set_poles(value),
//             3 => self.drive.set(value * 5.),
//             _ => (),
//         }
//     }

//     fn get_parameter_name(&self, index: i32) -> String {
//         match index {
//             0 => "cutoff".to_string(),
//             1 => "resonance".to_string(),
//             2 => "filter order".to_string(),
//             3 => "drive".to_string(),
//             _ => "".to_string(),
//         }
//     }

//     fn get_parameter_label(&self, index: i32) -> String {
//         match index {
//             0 => "Hz".to_string(),
//             1 => "%".to_string(),
//             2 => "poles".to_string(),
//             3 => "%".to_string(),
//             _ => "".to_string(),
//         }
//     }
//     // This is what will display underneath our control.  We can
//     // format it into a string that makes the most sense.
//     fn get_parameter_text(&self, index: i32) -> String {
//         match index {
//             0 => format!("{:.0}", self.cutoff.get()),
//             1 => format!("{:.3}", self.res.get()),
//             2 => format!("{}", self.poles.load(Ordering::Relaxed) + 1),
//             3 => format!("{:.3}", self.drive.get()),
//             _ => format!(""),
//         }
//     }
// }

#[derive(Default)]
struct VocalSynth {
    // params: Arc<Parameters>,
    sample_rate: f32,
    time: f32,
    note_duration: f32,
    note: Option<u8>,
}

impl VocalSynth {
    fn time_per_sample(&self) -> f32 {
        1.0 / self.sample_rate
    }

    /// Process an incoming midi event.
    ///
    /// The midi data is split up like so:
    ///
    /// `data[0]`: Contains the status and the channel. Source: [source]
    /// `data[1]`: Contains the supplemental data for the message - so, if this was a NoteOn then
    ///            this would contain the note.
    /// `data[2]`: Further supplemental data. Would be velocity in the case of a NoteOn message.
    ///
    /// [source]: http://www.midimountain.com/midi/midi_status.htm
    fn process_midi_event(&mut self, data: [u8; 3]) {
        match data[0] {
            128 => self.note_off(data[1]),
            144 => self.note_on(data[1]),
            _ => (),
        }
    }

    fn note_on(&mut self, note: u8) {
        self.note_duration = 0.0;
        self.note = Some(note)
    }

    fn note_off(&mut self, note: u8) {
        if self.note == Some(note) {
            self.note = None
        }
    }
}

impl Plugin for VocalSynth {
    fn new(_host: HostCallback) -> Self {
        VocalSynth {
            sample_rate: 44100.0,
            note_duration: 0.0,
            time: 0.0,
            note: None,
        }
    }

    fn get_info(&self) -> Info {
        Info {
            name: "Viardot".to_string(),
            vendor: "Louis Dutton".to_string(),
            unique_id: 6667,
            category: Category::Synth,
            inputs: 1,
            outputs: 1,
            parameters: 1,
            initial_delay: 0,
            ..Info::default()
        }
    }

    #[allow(unused_variables)]
    #[allow(clippy::single_match)]
    fn process_events(&mut self, events: &Events) {
        for event in events.events() {
            match event {
                Event::Midi(ev) => self.process_midi_event(ev.data),
                // More events can be handled here.
                _ => (),
            }
        }
    }

    fn set_sample_rate(&mut self, rate: f32) {
        self.sample_rate = rate;
    }

    fn process(&mut self, buffer: &mut AudioBuffer<f32>) {
        let samples = buffer.samples();
        let (_, mut outputs) = buffer.split();
        let output_count = outputs.len();
        let per_sample = self.time_per_sample();
        let mut output_sample;
        for sample_idx in 0..samples {
            let time = self.time;
            let note_duration = self.note_duration;
            if let Some(current_note) = self.note {
                let signal = (time * midi_pitch_to_freq(current_note) * TAU).sin();

                // Apply a quick envelope to the attack of the signal to avoid popping.
                let attack = 0.5;
                let alpha = if note_duration < attack {
                    note_duration / attack
                } else {
                    1.0
                };

                output_sample = (signal * alpha) as f32;

                self.time += per_sample;
                self.note_duration += per_sample;
            } else {
                output_sample = 0.0;
            }
            for buf_idx in 0..output_count {
                let buff = outputs.get_mut(buf_idx);
                buff[sample_idx] = output_sample;
            }
        }
    }

    fn can_do(&self, can_do: CanDo) -> Supported {
        match can_do {
            CanDo::ReceiveMidiEvent => Supported::Yes,
            _ => Supported::Maybe,
        }
    }
}

plugin_main!(VocalSynth); // Important!

#[cfg(test)]
mod tests {
    use crate::midi_pitch_to_freq;

    #[test]
    fn test_midi_pitch_to_freq() {
        for i in 0..127 {
            // expect no panics
            midi_pitch_to_freq(i);
        }
    }
}
