//! A collection of stateful signal filters.

pub mod tract;

/// A stateful delay line. Samples are delayed for `delay_length` seconds.
///
/// https://en.wikipedia.org/wiki/Analog_delay_line
///
/// ```
/// use synthrs::filter::AllPass;
///
/// let mut allpass = AllPass::new(1.0, 44_100, 0.5);
/// let samples: Vec<f64> = vec![1.0, 2.0, 3.0, 4.0];
///
/// let filtered = samples.into_iter().map(|sample| allpass.tick(sample));
/// ```
///
/// Taken from: https://github.com/irh/freeverb-rs/blob/master/freeverb/src/delay_line.rs
#[derive(Clone, Debug)]
pub struct DelayLine {
    pub buf: Vec<f64>,
    index: usize,
    pub delay_length: f64,
    pub delay_samples: usize,
    pub sample_rate: usize,
}

impl DelayLine {
    /// Creates a new delay line. Samples are delayed for `delay_length` seconds.
    pub fn new(delay_length: f64, sample_rate: usize) -> DelayLine {
        let delay_samples = ((delay_length * sample_rate as f64).round() + 1.0) as usize;

        DelayLine {
            buf: vec![0.0; delay_samples],
            index: 0,
            delay_length,
            delay_samples,
            sample_rate,
        }
    }

    pub fn read(&self) -> f64 {
        self.buf[self.index]
    }

    pub fn write(&mut self, value: f64) {
        self.buf[self.index] = value;

        if self.index == self.buf.len() - 1 {
            self.index = 0;
        } else {
            self.index += 1;
        }
    }
}

/// A stateful all-pass filter.
///
/// https://en.wikipedia.org/wiki/All-pass_filter
///
/// ```
/// use synthrs::filter::AllPass;
///
/// let mut allpass = AllPass::new(1.0, 44_100, 0.5);
/// let samples: Vec<f64> = vec![1.0, 2.0, 3.0, 4.0];
///
/// let filtered = samples.into_iter().map(|sample| allpass.tick(sample));
/// ```
///
/// Taken from: https://github.com/irh/freeverb-rs/blob/master/freeverb/src/all_pass.rs
#[derive(Clone, Debug)]
pub struct AllPass {
    delay_line: DelayLine,
    /// Feedback multiplier (0.5 works)
    pub feedback: f64,
}

impl AllPass {
    /// Creates a new all-pass filter. Samples are delayed for `delay_length` seconds.
    pub fn new(delay_length: f64, sample_rate: usize, feedback: f64) -> AllPass {
        AllPass {
            delay_line: DelayLine::new(delay_length, sample_rate),
            feedback,
        }
    }

    pub fn tick(&mut self, input: f64) -> f64 {
        let delayed = self.delay_line.read();
        self.delay_line.write(input + delayed * self.feedback);
        -input + delayed
    }
}

/// A stateful comb filter.
///
/// https://en.wikipedia.org/wiki/Comb_filter
///
/// ```
/// use synthrs::filter::Comb;
///
/// let mut comb = Comb::new(1.0, 44_100, 0.5, 0.5, 0.5);
/// let samples: Vec<f64> = vec![1.0, 2.0, 3.0, 4.0];
///
/// let filtered = samples.into_iter().map(|sample| comb.tick(sample));
/// ```
///
/// Taken from: https://github.com/irh/freeverb-rs/blob/master/freeverb/src/comb.rs
#[derive(Clone, Debug)]
pub struct Comb {
    delay_line: DelayLine,
    filter_state: f64,
    /// 0.5 works
    pub dampening_inverse: f64,
    /// 0.5 works
    pub dampening: f64,
    /// 0.5 works
    pub feedback: f64,
}

impl Comb {
    /// Creates a new comb filter. Samples are delayed for `delay_length` seconds.
    pub fn new(
        delay_length: f64,
        sample_rate: usize,
        dampening_inverse: f64,
        dampening: f64,
        feedback: f64,
    ) -> Comb {
        Comb {
            dampening_inverse,
            dampening,
            delay_line: DelayLine::new(delay_length, sample_rate),
            feedback,
            filter_state: 0.0,
        }
    }

    pub fn tick(&mut self, input: f64) -> f64 {
        let output = self.delay_line.read();
        self.filter_state = output * self.dampening_inverse + self.filter_state * self.dampening;
        self.delay_line
            .write(input + self.filter_state * self.feedback);

        output
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[allow(clippy::float_cmp)]
    fn test_delay_line() {
        let mut delay_line = DelayLine::new(3.0, 1);

        delay_line.write(1.0);
        assert_eq!(delay_line.read(), 0.0);
        delay_line.write(3.0);
        assert_eq!(delay_line.read(), 0.0);
        delay_line.write(5.0);
        assert_eq!(delay_line.read(), 0.0);
        delay_line.write(7.0);
        assert_eq!(delay_line.read(), 1.0);
        delay_line.write(11.0);
        assert_eq!(delay_line.read(), 3.0);
        delay_line.write(13.0);
        assert_eq!(delay_line.read(), 5.0);
        delay_line.write(17.0);
        assert_eq!(delay_line.read(), 7.0);
    }
}
