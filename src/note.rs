// Note frequencies calculated using A4 = 440 Hz as reference
// Formula: f = 440 * 2^((n-69)/12) where n is MIDI note number

// Octave 0
pub const C0: f64 = 16.351597831287414;
pub const D0: f64 = 18.354047994837977;
pub const E0: f64 = 20.601722307054366;
pub const F0: f64 = 21.826764464562746;
pub const G0: f64 = 24.499714748859326;
pub const A0: f64 = 27.5;
pub const B0: f64 = 30.86770632850775;

// Octave 1
pub const C1: f64 = 32.70319566257483;
pub const D1: f64 = 36.70809598967594;
pub const E1: f64 = 41.20344461410875;
pub const F1: f64 = 43.653528929125486;
pub const G1: f64 = 48.999429497718666;
pub const A1: f64 = 55.0;
pub const B1: f64 = 61.7354126570155;

// Octave 2
pub const C2: f64 = 65.40639132514966;
pub const D2: f64 = 73.41619197935188;
pub const E2: f64 = 82.4068892282175;
pub const F2: f64 = 87.30705785825097;
pub const G2: f64 = 97.99885899543733;
pub const A2: f64 = 110.0;
pub const B2: f64 = 123.47082531403103;

// Octave 3
pub const C3: f64 = 130.8127826502993;
pub const D3: f64 = 146.8323839587038;
pub const E3: f64 = 164.81377845643496;
pub const F3: f64 = 174.61411571650194;
pub const G3: f64 = 195.99771799087463;
pub const A3: f64 = 220.0;
pub const B3: f64 = 246.94165062806206;

// Octave 4 (middle octave)
pub const C4: f64 = 261.6255653005986;
pub const D4: f64 = 293.6647679174076;
pub const E4: f64 = 329.6275569128699;
pub const F4: f64 = 349.2282314330039;
pub const G4: f64 = 391.99543598174927;
pub const A4: f64 = 440.0;
pub const B4: f64 = 493.8833012561241;

// Octave 5
pub const C5: f64 = 523.2511306011972;
pub const D5: f64 = 587.3295358348151;
pub const E5: f64 = 659.2551138257398;
pub const F5: f64 = 698.4564628660078;
pub const G5: f64 = 783.9908719634985;
pub const A5: f64 = 880.0;
pub const B5: f64 = 987.7666025122483;

// Octave 6
pub const C6: f64 = 1046.5022612023945;
pub const D6: f64 = 1174.6590716696303;
pub const E6: f64 = 1318.5102276514797;
pub const F6: f64 = 1396.9129257320155;
pub const G6: f64 = 1567.981743926997;
pub const A6: f64 = 1760.0;
pub const B6: f64 = 1975.533205024496;

// Octave 7
pub const C7: f64 = 2093.004522404789;
pub const D7: f64 = 2349.31814333926;
pub const E7: f64 = 2637.02045530296;
pub const F7: f64 = 2793.825851464031;
pub const G7: f64 = 3135.9634878539946;
pub const A7: f64 = 3520.0;
pub const B7: f64 = 3951.066410048992;

// Octave 8
pub const C8: f64 = 4186.009044809578;
pub const D8: f64 = 4698.63628667852;
pub const E8: f64 = 5274.04091060592;
pub const F8: f64 = 5587.651702928062;
pub const G8: f64 = 6271.926975707989;
pub const A8: f64 = 7040.0;
pub const B8: f64 = 7902.132820097988;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_note_frequencies() {
        assert_eq!(A4, 440.0);
        // Test some octave relationships
        assert!((A5 - A4 * 2.0).abs() < 0.001);
        assert!((A3 - A4 / 2.0).abs() < 0.001);
    }
}