use std::collections::VecDeque;

/// A simple reverb implementation using multiple delay lines and feedback
pub struct Reverb {
    delay_lines: Vec<DelayLine>,
    wet_level: f64,
    dry_level: f64,
}

struct DelayLine {
    buffer: VecDeque<f64>,
    delay_samples: usize,
    feedback: f64,
    damping: f64,
    filter_state: f64,
}

impl DelayLine {
    fn new(delay_samples: usize, feedback: f64, damping: f64) -> Self {
        Self {
            buffer: VecDeque::with_capacity(delay_samples + 1),
            delay_samples,
            feedback,
            damping,
            filter_state: 0.0,
        }
    }

    fn process(&mut self, input: f64) -> f64 {
        // Ensure buffer is at correct size
        while self.buffer.len() < self.delay_samples {
            self.buffer.push_back(0.0);
        }

        // Get delayed sample
        let delayed = self.buffer.front().copied().unwrap_or(0.0);
        
        // Apply simple lowpass filter for damping
        self.filter_state = self.filter_state * (1.0 - self.damping) + delayed * self.damping;
        let filtered = self.filter_state;
        
        // Add input + feedback to buffer
        let feedback_sample = input + filtered * self.feedback;
        self.buffer.push_back(feedback_sample);
        
        // Remove oldest sample if buffer is too long
        if self.buffer.len() > self.delay_samples {
            self.buffer.pop_front();
        }
        
        delayed
    }
}

impl Reverb {
    /// Creates a new reverb with reasonable default parameters
    pub fn new(sample_rate: usize) -> Self {
        let delay_times_ms = vec![29.7, 37.1, 41.1, 43.7, 47.0, 50.0, 53.2, 56.3];
        let mut delay_lines = Vec::new();
        
        for &delay_ms in &delay_times_ms {
            let delay_samples = ((delay_ms / 1000.0) * sample_rate as f64) as usize;
            let feedback = 0.5;
            let damping = 0.2;
            delay_lines.push(DelayLine::new(delay_samples, feedback, damping));
        }
        
        Self {
            delay_lines,
            wet_level: 0.3,
            dry_level: 0.7,
        }
    }
    
    /// Creates a reverb with custom parameters
    pub fn with_params(sample_rate: usize, wet_level: f64, dry_level: f64, room_size: f64) -> Self {
        let base_delay_times = vec![29.7, 37.1, 41.1, 43.7, 47.0, 50.0, 53.2, 56.3];
        let mut delay_lines = Vec::new();
        
        for &delay_ms in &base_delay_times {
            let scaled_delay = delay_ms * room_size;
            let delay_samples = ((scaled_delay / 1000.0) * sample_rate as f64) as usize;
            let feedback = 0.4 + room_size * 0.3; // More feedback for larger rooms
            let damping = 0.1 + (1.0 - room_size) * 0.3; // More damping for smaller rooms
            delay_lines.push(DelayLine::new(delay_samples, feedback, damping));
        }
        
        Self {
            delay_lines,
            wet_level,
            dry_level,
        }
    }
    
    /// Process a single sample through the reverb
    pub fn process(&mut self, input: f64) -> f64 {
        let mut wet_output = 0.0;
        
        // Sum outputs from all delay lines
        for delay_line in &mut self.delay_lines {
            wet_output += delay_line.process(input);
        }
        
        // Average the delay line outputs
        wet_output /= self.delay_lines.len() as f64;
        
        // Mix dry and wet signals
        input * self.dry_level + wet_output * self.wet_level
    }
    
    /// Set the wet/dry mix (0.0 = all dry, 1.0 = all wet)
    pub fn set_wet_level(&mut self, wet_level: f64) {
        self.wet_level = wet_level.clamp(0.0, 1.0);
        self.dry_level = 1.0 - self.wet_level;
    }
}